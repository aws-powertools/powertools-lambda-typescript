import {
  type CloudFormationClient,
  DeleteStackCommand,
  type DeleteStackCommandInput,
  DescribeStacksCommand,
  type Stack,
  type StackStatus,
} from '@aws-sdk/client-cloudformation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MIN_STACK_AGE_HOURS,
  type StackDeleteWaiter,
  type SweepStaleStacksOptions,
  sweepStaleStacks,
} from '../../src/e2e/sweepStaleStacks.js';

const NOW = new Date('2026-08-31T12:00:00.000Z').getTime();
const HOUR_IN_MS = 3_600_000;
const MINUTE_IN_MS = 60_000;
const ACCOUNT_ID = '123456789012';
const E2E_TAGS = [{ Key: 'Service', Value: 'Powertools-for-AWS-e2e-tests' }];

const stackIdOf = (stackName: string): string =>
  `arn:aws:cloudformation:eu-west-1:${ACCOUNT_ID}:stack/${stackName}/11111111-2222-3333-4444-555555555555`;

const stackNameOf = (stackId: string): string => stackId.split('/')[1];

const createdHoursAgo = (hours: number): Date =>
  new Date(NOW - hours * HOUR_IN_MS);

/**
 * A `DescribeStacks` entry that is a valid sweep candidate by default: a tagged
 * root stack, created a day ago. Each test overrides only the attribute it is
 * about.
 */
const makeStack = (
  stackName: string,
  overrides: Partial<Stack> = {}
): Stack => ({
  StackName: stackName,
  StackId: stackIdOf(stackName),
  StackStatus: 'CREATE_COMPLETE',
  CreationTime: createdHoursAgo(24),
  Tags: E2E_TAGS,
  ...overrides,
});

type DescribeStacksPage = { Stacks?: Stack[]; NextToken?: string };

type StubOptions = {
  /**
   * Responses returned by the successive paginated (unnamed) `DescribeStacks`
   * calls. An `Error` element makes that page's call reject.
   */
  pages?: (DescribeStacksPage | Error)[];
  /**
   * Responses returned by `DescribeStacks` for a single stack id, i.e. the
   * second-pass re-check, keyed by stack name. `null` stands for an empty
   * `Stacks` array, a missing entry for a stack CloudFormation no longer knows.
   */
  recheck?: Record<string, Stack | Error | null>;
};

/**
 * A hand-rolled `CloudFormationClient` stub. It records the order of the calls
 * it receives in `events`, which the ordering and dependency assertions rely
 * on.
 */
const createStub = ({ pages = [], recheck = {} }: StubOptions = {}) => {
  const events: string[] = [];
  const deleteInputs: DeleteStackCommandInput[] = [];
  let pageIndex = 0;

  const send = vi.fn(async (command: unknown) => {
    if (command instanceof DescribeStacksCommand) {
      const stackId = command.input.StackName;
      if (stackId) {
        const stackName = stackNameOf(stackId);
        events.push(`recheck:${stackName}`);
        const outcome = recheck[stackName];
        if (outcome instanceof Error) {
          throw outcome;
        }
        if (outcome === null) {
          return { Stacks: [] };
        }
        if (outcome === undefined) {
          throw new Error(`Stack with id ${stackId} does not exist`);
        }
        return { Stacks: [outcome] };
      }
      const page = pages[pageIndex++];
      events.push(`describe:page${pageIndex}`);
      if (page instanceof Error) {
        throw page;
      }
      return page ?? {};
    }
    if (command instanceof DeleteStackCommand) {
      deleteInputs.push(command.input);
      events.push(`delete:${stackNameOf(command.input.StackName as string)}`);
      return {};
    }
    throw new Error('Unexpected command');
  });

  return {
    client: { send } as unknown as CloudFormationClient,
    deleteInputs,
    events,
    send,
    deletedStacks: () =>
      events
        .filter((event) => event.startsWith('delete:'))
        .map((event) => event.slice('delete:'.length)),
  };
};

/**
 * A waiter that resolves immediately unless the stack is listed in `failFor`,
 * standing in for the real `waitUntilStackDeleteComplete`.
 */
const createWaiter = (
  events: string[],
  failFor: Record<string, Error> = {}
): StackDeleteWaiter =>
  vi.fn(async (_client, stackId) => {
    const stackName = stackNameOf(stackId);
    events.push(`waitStart:${stackName}`);
    const failure = failFor[stackName];
    if (failure) {
      events.push(`waitFail:${stackName}`);
      throw failure;
    }
    events.push(`waitEnd:${stackName}`);
  });

/**
 * Runs the sweep with a clock frozen at `NOW`, so the time budget is never
 * exhausted unless the test says so.
 */
const sweep = async (
  client: CloudFormationClient,
  waiter: StackDeleteWaiter,
  overrides: Partial<SweepStaleStacksOptions> = {}
) =>
  await sweepStaleStacks({
    client,
    now: NOW,
    clock: () => NOW,
    waiter,
    log: () => {},
    ...overrides,
  });

describe('sweepStaleStacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('discovery', () => {
    it('follows the DescribeStacks pagination', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          { Stacks: [makeStack('First')], NextToken: 'next' },
          { Stacks: [makeStack('Second')] },
        ],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.candidates.map(({ stackName }) => stackName)).toEqual([
        'First',
        'Second',
      ]);
      expect(report.deleted).toEqual(['First', 'Second']);
      expect(report.ok).toBe(true);
    });

    it('selects a stack that carries the exact e2e tag', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          {
            Stacks: [
              makeStack('Tagged', {
                Tags: [
                  { Key: 'Team', Value: 'powertools' },
                  ...E2E_TAGS,
                  { Key: 'Other', Value: 'value' },
                ],
              }),
            ],
          },
        ],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.candidates).toEqual([
        {
          stackName: 'Tagged',
          status: 'CREATE_COMPLETE',
          ageHours: 24,
          reason: 'tag',
        },
      ]);
    });

    it('selects an untagged stack whose name marks it as a shared LMI stack', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          { Stacks: [makeStack('LmiShared-1234-x86', { Tags: undefined })] },
        ],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.candidates).toEqual([
        {
          stackName: 'LmiShared-1234-x86',
          status: 'CREATE_COMPLETE',
          ageHours: 24,
          reason: 'lmi-shared-name',
        },
      ]);
      expect(report.deleted).toEqual(['LmiShared-1234-x86']);
    });

    it.each([
      {
        case: 'the tag value only looks like the e2e one',
        tags: [{ Key: 'Service', Value: 'Powertools-for-AWS-e2e-tests-v2' }],
      },
      {
        case: 'the tag value differs in case',
        tags: [{ Key: 'Service', Value: 'powertools-for-aws-e2e-tests' }],
      },
      {
        case: 'the tag key differs',
        tags: [{ Key: 'service', Value: 'Powertools-for-AWS-e2e-tests' }],
      },
      { case: 'there is no tag at all', tags: [] },
    ])('rejects a stack when $case', async ({ tags }) => {
      // Prepare
      const stub = createStub({
        pages: [{ Stacks: [makeStack('SomeoneElses', { Tags: tags })] }],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.candidates).toEqual([]);
      expect(stub.deletedStacks()).toEqual([]);
      expect(report.ok).toBe(true);
    });

    it.each([
      { case: 'RootId', overrides: { RootId: stackIdOf('Root') } },
      { case: 'ParentId', overrides: { ParentId: stackIdOf('Parent') } },
    ])('rejects a nested stack ($case is set)', async ({ overrides }) => {
      // Prepare
      const stub = createStub({
        pages: [{ Stacks: [makeStack('Nested', overrides)] }],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.candidates).toEqual([]);
      expect(stub.deletedStacks()).toEqual([]);
    });

    it('rejects a stack younger than the minimum age, even next to an older one', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          {
            Stacks: [
              makeStack('TooYoung', {
                CreationTime: createdHoursAgo(MIN_STACK_AGE_HOURS - 0.1),
              }),
              makeStack('ExactlyAtTheLimit', {
                CreationTime: createdHoursAgo(MIN_STACK_AGE_HOURS),
              }),
              makeStack('OldEnough', {
                CreationTime: createdHoursAgo(MIN_STACK_AGE_HOURS + 0.1),
              }),
              makeStack('LmiShared-young', {
                CreationTime: createdHoursAgo(1),
                Tags: undefined,
              }),
              makeStack('NoCreationTime', { CreationTime: undefined }),
            ],
          },
        ],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.candidates).toEqual([
        {
          stackName: 'OldEnough',
          status: 'CREATE_COMPLETE',
          ageHours: 12.1,
          reason: 'tag',
        },
      ]);
      expect(stub.deletedStacks()).toEqual(['OldEnough']);
    });

    it('rejects stacks that are already deleted', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          { Stacks: [makeStack('Gone', { StackStatus: 'DELETE_COMPLETE' })] },
        ],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.candidates).toEqual([]);
      expect(stub.deletedStacks()).toEqual([]);
    });

    it('aborts without deleting anything when discovery fails partway', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          { Stacks: [makeStack('Discovered')], NextToken: 'next' },
          new Error(`Throttling: Rate exceeded for account ${ACCOUNT_ID}`),
        ],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.discoveryFailed).toBe(true);
      expect(report.candidates).toEqual([]);
      expect(report.deleted).toEqual([]);
      expect(report.ok).toBe(false);
      expect(stub.deletedStacks()).toEqual([]);
      expect(stub.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('in-progress stacks', () => {
    it.each<StackStatus>([
      'CREATE_IN_PROGRESS',
      'UPDATE_IN_PROGRESS',
      'DELETE_IN_PROGRESS',
      'UPDATE_ROLLBACK_IN_PROGRESS',
    ])('reports a %s stack instead of deleting it', async (status) => {
      // Prepare
      const stub = createStub({
        pages: [{ Stacks: [makeStack('Busy', { StackStatus: status })] }],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.skippedInProgress).toEqual([{ stackName: 'Busy', status }]);
      expect(report.deleted).toEqual([]);
      expect(stub.deletedStacks()).toEqual([]);
      expect(report.ok).toBe(false);
    });

    it('deletes a REVIEW_IN_PROGRESS stack, which holds no resources', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          {
            Stacks: [
              makeStack('NeverExecuted', { StackStatus: 'REVIEW_IN_PROGRESS' }),
            ],
          },
        ],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.skippedInProgress).toEqual([]);
      expect(stub.deletedStacks()).toEqual(['NeverExecuted']);
      expect(report.deleted).toEqual(['NeverExecuted']);
      expect(report.ok).toBe(true);
    });

    it('still deletes the other candidates', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          {
            Stacks: [
              makeStack('Busy', { StackStatus: 'UPDATE_IN_PROGRESS' }),
              makeStack('Idle'),
            ],
          },
        ],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(report.deleted).toEqual(['Idle']);
      expect(report.skippedInProgress).toEqual([
        { stackName: 'Busy', status: 'UPDATE_IN_PROGRESS' },
      ]);
    });
  });

  describe('deletion order & concurrency', () => {
    it('deletes the shared LMI stacks only after every other stack is gone', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          {
            Stacks: [
              makeStack('LmiShared-1234-arm64'),
              makeStack('Alpha-Lmi-1234'),
              makeStack('LmiShared-1234-x86'),
              makeStack('Beta-Lmi-1234'),
            ],
          },
        ],
      });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events));

      // Assess
      expect(stub.deletedStacks()).toEqual([
        'Alpha-Lmi-1234',
        'Beta-Lmi-1234',
        'LmiShared-1234-arm64',
        'LmiShared-1234-x86',
      ]);
      const firstSharedDelete = stub.events.indexOf(
        'delete:LmiShared-1234-arm64'
      );
      for (const stackName of ['Alpha-Lmi-1234', 'Beta-Lmi-1234']) {
        expect(stub.events.indexOf(`waitEnd:${stackName}`)).toBeLessThan(
          firstSharedDelete
        );
      }
      expect(report.ok).toBe(true);
    });

    it('never keeps more than 5 deletions in flight', async () => {
      // Prepare
      const stackNames = Array.from(
        { length: 7 },
        (_value, index) => `Stack-${index}`
      );
      const stub = createStub({
        pages: [
          { Stacks: stackNames.map((stackName) => makeStack(stackName)) },
        ],
      });
      let inFlight = 0;
      let maxInFlight = 0;
      // Blocking for a few ticks is what makes the overlap observable: without
      // a limiter every stack would be waiting at the same time.
      const waiter: StackDeleteWaiter = vi.fn(async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => {
          setTimeout(resolve, 5);
        });
        inFlight -= 1;
      });

      // Act
      const report = await sweep(stub.client, waiter);

      // Assess
      expect(maxInFlight).toBe(5);
      expect(report.deleted).toHaveLength(stackNames.length);
      expect(report.ok).toBe(true);
    });
  });

  describe('second pass', () => {
    it('retries a stack that is still DELETE_FAILED', async () => {
      // Prepare
      const stub = createStub({
        pages: [{ Stacks: [makeStack('Stubborn')] }],
        recheck: {
          Stubborn: makeStack('Stubborn', { StackStatus: 'DELETE_FAILED' }),
        },
      });
      const attempts: string[] = [];
      const failFirstAttempt: StackDeleteWaiter = vi.fn(
        async (_client, stackId) => {
          const stackName = stackNameOf(stackId);
          if (!attempts.includes(stackName)) {
            attempts.push(stackName);
            throw new Error('Resource is still in use');
          }
        }
      );

      // Act
      const report = await sweep(stub.client, failFirstAttempt);

      // Assess
      expect(stub.deletedStacks()).toEqual(['Stubborn', 'Stubborn']);
      expect(stub.events).toContain('recheck:Stubborn');
      expect(report.deleted).toEqual(['Stubborn']);
      expect(report.unresolved).toEqual([]);
      expect(report.ok).toBe(true);
    });

    it('deletes the shared LMI stacks last on the retry as well', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          {
            Stacks: [makeStack('LmiShared-1234-x86'), makeStack('Alpha')],
          },
        ],
        recheck: {
          'LmiShared-1234-x86': makeStack('LmiShared-1234-x86', {
            StackStatus: 'DELETE_FAILED',
          }),
          Alpha: makeStack('Alpha', { StackStatus: 'DELETE_FAILED' }),
        },
      });
      const attempts: string[] = [];
      const failFirstAttempt: StackDeleteWaiter = vi.fn(
        async (_client, stackId) => {
          const stackName = stackNameOf(stackId);
          if (!attempts.includes(stackName)) {
            attempts.push(stackName);
            throw new Error('ENI still attached');
          }
          stub.events.push(`waitEnd:${stackName}`);
        }
      );

      // Act
      const report = await sweep(stub.client, failFirstAttempt);

      // Assess
      expect(stub.deletedStacks()).toEqual([
        'Alpha',
        'LmiShared-1234-x86',
        'Alpha',
        'LmiShared-1234-x86',
      ]);
      expect(stub.events.indexOf('waitEnd:Alpha')).toBeLessThan(
        stub.events.lastIndexOf('delete:LmiShared-1234-x86')
      );
      expect(report.deleted).toEqual(['Alpha', 'LmiShared-1234-x86']);
      expect(report.ok).toBe(true);
    });

    it.each<{ case: string; recheck: StubOptions['recheck'] }>([
      {
        case: 'CloudFormation no longer knows',
        recheck: {},
      },
      {
        case: 'CloudFormation returns no description for',
        recheck: { Slow: null },
      },
      {
        case: 'is DELETE_COMPLETE by the time of the re-check',
        recheck: {
          Slow: makeStack('Slow', { StackStatus: 'DELETE_COMPLETE' }),
        },
      },
    ])('treats a stack that $case as deleted', async ({ recheck }) => {
      // Prepare
      const stub = createStub({
        pages: [{ Stacks: [makeStack('Slow')] }],
        recheck,
      });
      const waiter = createWaiter(stub.events, {
        Slow: new Error('Waiter timed out'),
      });

      // Act
      const report = await sweep(stub.client, waiter);

      // Assess
      expect(stub.deletedStacks()).toEqual(['Slow']);
      expect(report.deleted).toEqual(['Slow']);
      expect(report.unresolved).toEqual([]);
      expect(report.ok).toBe(true);
    });

    it('does not retry a stack CloudFormation has started an operation on', async () => {
      // Prepare
      const stub = createStub({
        pages: [{ Stacks: [makeStack('Grabbed')] }],
        recheck: {
          Grabbed: makeStack('Grabbed', {
            StackStatus: 'UPDATE_ROLLBACK_IN_PROGRESS',
          }),
        },
      });
      const waiter = createWaiter(stub.events, {
        Grabbed: new Error('Delete failed'),
      });

      // Act
      const report = await sweep(stub.client, waiter);

      // Assess
      expect(stub.deletedStacks()).toEqual(['Grabbed']);
      expect(report.deleted).toEqual([]);
      expect(report.unresolved).toEqual([
        {
          stackName: 'Grabbed',
          status: 'UPDATE_ROLLBACK_IN_PROGRESS',
          reason:
            'CloudFormation is busy with the stack (UPDATE_ROLLBACK_IN_PROGRESS), it was not deleted again',
        },
      ]);
      expect(report.ok).toBe(false);
    });

    it('reports a stack that will not delete, with account details redacted', async () => {
      // Prepare
      const stub = createStub({
        pages: [{ Stacks: [makeStack('Broken')] }],
        recheck: {
          Broken: makeStack('Broken', { StackStatus: 'DELETE_FAILED' }),
        },
      });
      const waiter = createWaiter(stub.events, {
        Broken: new Error(
          `The following resource(s) failed to delete: [Fn]. Role arn:aws:iam::${ACCOUNT_ID}:role/e2e is invalid or cannot be assumed by account ${ACCOUNT_ID}`
        ),
      });

      // Act
      const report = await sweep(stub.client, waiter);

      // Assess
      expect(report.unresolved).toEqual([
        {
          stackName: 'Broken',
          status: 'DELETE_FAILED',
          reason:
            'The following resource(s) failed to delete: [Fn]. Role [REDACTED] is invalid or cannot be assumed by account [REDACTED]',
        },
      ]);
      expect(report.deleted).toEqual([]);
      expect(report.ok).toBe(false);
    });
  });

  describe('time budget', () => {
    it('starts no new deletion once the budget is exhausted', async () => {
      // Prepare
      const stackNames = Array.from(
        { length: 7 },
        (_value, index) => `Stack-${index}`
      );
      const stub = createStub({
        pages: [
          { Stacks: stackNames.map((stackName) => makeStack(stackName)) },
        ],
      });
      let elapsedMs = 0;
      // Each of the 5 concurrent waits burns 10 minutes of a 25 minute budget,
      // so the deletions that have not started yet never will.
      const waiter: StackDeleteWaiter = vi.fn(async () => {
        elapsedMs += 10 * MINUTE_IN_MS;
      });

      // Act
      const report = await sweep(stub.client, waiter, {
        clock: () => NOW + elapsedMs,
        timeBudgetMs: 25 * MINUTE_IN_MS,
      });

      // Assess
      expect(stub.deletedStacks()).toEqual([
        'Stack-0',
        'Stack-1',
        'Stack-2',
        'Stack-3',
        'Stack-4',
      ]);
      expect(report.deleted).toHaveLength(5);
      expect(report.unresolved).toEqual([
        {
          stackName: 'Stack-5',
          status: 'CREATE_COMPLETE',
          reason: 'Time budget exhausted, the delete was never attempted',
        },
        {
          stackName: 'Stack-6',
          status: 'CREATE_COMPLETE',
          reason: 'Time budget exhausted, the delete was never attempted',
        },
      ]);
      // The report is still complete: every candidate is accounted for, and the
      // sweep returns normally so the workflow can read it.
      expect(report.candidates).toHaveLength(7);
      expect(report.discoveryFailed).toBe(false);
      expect(report.ok).toBe(false);
    });

    it('reports a stack it was still waiting for when the budget ran out', async () => {
      // Prepare
      const stub = createStub({
        pages: [{ Stacks: [makeStack('Slow')] }],
      });
      let elapsedMs = 0;
      const waiter: StackDeleteWaiter = vi.fn(async () => {
        elapsedMs += 30 * MINUTE_IN_MS;
        throw new Error('Waiter timed out');
      });

      // Act
      const report = await sweep(stub.client, waiter, {
        clock: () => NOW + elapsedMs,
        timeBudgetMs: 20 * MINUTE_IN_MS,
      });

      // Assess
      expect(report.unresolved).toEqual([
        {
          stackName: 'Slow',
          status: 'CREATE_COMPLETE',
          reason:
            'Time budget exhausted while waiting for the delete to complete',
        },
      ]);
      expect(report.deleted).toEqual([]);
      // Out of time means out of re-checks and retries too.
      expect(stub.events).not.toContain('recheck:Slow');
      expect(stub.deletedStacks()).toEqual(['Slow']);
      expect(report.ok).toBe(false);
    });

    it.each([
      {
        case: 'the budget when it is the shorter of the two',
        budgetMinutes: 5,
        expectedSeconds: 300,
      },
      {
        case: 'the per-stack maximum otherwise',
        budgetMinutes: 60,
        expectedSeconds: 1200,
      },
    ])(
      'caps each wait at $case',
      async ({ budgetMinutes, expectedSeconds }) => {
        // Prepare
        const stub = createStub({ pages: [{ Stacks: [makeStack('Alpha')] }] });
        const waiter = createWaiter(stub.events);

        // Act
        await sweep(stub.client, waiter, {
          timeBudgetMs: budgetMinutes * MINUTE_IN_MS,
        });

        // Assess
        expect(waiter).toHaveBeenCalledWith(
          stub.client,
          stackIdOf('Alpha'),
          expectedSeconds
        );
      }
    );

    it.each([
      {
        case: 'keeps deleting while the default budget lasts',
        elapsedMinutes: 49,
        expectedDeleted: ['Alpha', 'LmiShared-1234-x86'],
        expectedUnresolved: [],
      },
      {
        case: 'stops once the default budget is spent',
        elapsedMinutes: 51,
        expectedDeleted: ['Alpha'],
        expectedUnresolved: [
          {
            stackName: 'LmiShared-1234-x86',
            status: 'CREATE_COMPLETE',
            reason: 'Time budget exhausted, the delete was never attempted',
          },
        ],
      },
    ])(
      '$case',
      async ({ elapsedMinutes, expectedDeleted, expectedUnresolved }) => {
        // Prepare
        const stub = createStub({
          pages: [
            { Stacks: [makeStack('Alpha'), makeStack('LmiShared-1234-x86')] },
          ],
        });
        let elapsedMs = 0;
        // Deleting `Alpha` in the first phase burns the time, so the shared
        // stack's phase is the one that sees the budget as it stands.
        const waiter: StackDeleteWaiter = vi.fn(async (_client, stackId) => {
          if (stackNameOf(stackId) === 'Alpha') {
            elapsedMs += elapsedMinutes * MINUTE_IN_MS;
          }
        });

        // Act
        const report = await sweep(stub.client, waiter, {
          clock: () => NOW + elapsedMs,
        });

        // Assess
        expect(report.deleted).toEqual(expectedDeleted);
        expect(report.unresolved).toEqual(expectedUnresolved);
      }
    );

    it('skips the retry when the budget ran out during the first pass', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          { Stacks: [makeStack('Alpha'), makeStack('LmiShared-1234-x86')] },
        ],
        recheck: {
          Alpha: makeStack('Alpha', { StackStatus: 'DELETE_FAILED' }),
        },
      });
      let elapsedMs = 0;
      // `Alpha` fails while there is still time, then deleting the shared stack
      // in the next phase burns what is left of the budget.
      const waiter: StackDeleteWaiter = vi.fn(async (_client, stackId) => {
        if (stackNameOf(stackId) === 'Alpha') {
          throw new Error('Resource is still in use');
        }
        elapsedMs += 60 * MINUTE_IN_MS;
      });

      // Act
      const report = await sweep(stub.client, waiter, {
        clock: () => NOW + elapsedMs,
        timeBudgetMs: 30 * MINUTE_IN_MS,
      });

      // Assess
      expect(report.deleted).toEqual(['LmiShared-1234-x86']);
      expect(report.unresolved).toEqual([
        {
          stackName: 'Alpha',
          status: 'CREATE_COMPLETE',
          reason: 'Time budget exhausted before the delete could be retried',
        },
      ]);
      expect(stub.events).not.toContain('recheck:Alpha');
      expect(stub.deletedStacks()).toEqual(['Alpha', 'LmiShared-1234-x86']);
      expect(report.ok).toBe(false);
    });
  });

  describe('dry run', () => {
    it('reports the candidates without deleting anything', async () => {
      // Prepare
      const stub = createStub({
        pages: [
          {
            Stacks: [
              makeStack('Alpha'),
              makeStack('LmiShared-1234-x86', { Tags: undefined }),
              makeStack('Busy', { StackStatus: 'DELETE_IN_PROGRESS' }),
              makeStack('Fresh', { CreationTime: createdHoursAgo(1) }),
            ],
          },
        ],
      });
      const waiter = createWaiter(stub.events);

      // Act
      const report = await sweep(stub.client, waiter, { dryRun: true });

      // Assess
      expect(report.dryRun).toBe(true);
      expect(report.candidates.map(({ stackName }) => stackName)).toEqual([
        'Alpha',
        'Busy',
        'LmiShared-1234-x86',
      ]);
      expect(report.deleted).toEqual([]);
      expect(report.skippedInProgress).toEqual([
        { stackName: 'Busy', status: 'DELETE_IN_PROGRESS' },
      ]);
      expect(stub.deletedStacks()).toEqual([]);
      expect(waiter).not.toHaveBeenCalled();
      // A dry run changes nothing, so there is nothing to fail.
      expect(report.ok).toBe(true);
    });

    it('is not ok when discovery failed', async () => {
      // Prepare
      const stub = createStub({ pages: [new Error('AccessDenied')] });

      // Act
      const report = await sweep(stub.client, createWaiter(stub.events), {
        dryRun: true,
      });

      // Assess
      expect(report.discoveryFailed).toBe(true);
      expect(report.ok).toBe(false);
    });
  });

  it('reports the agreed shape when there is nothing to sweep', async () => {
    // Prepare
    const stub = createStub({ pages: [{ Stacks: [] }] });

    // Act
    const report = await sweep(stub.client, createWaiter(stub.events));

    // Assess
    expect(report).toEqual({
      dryRun: false,
      timestamp: '2026-08-31T12:00:00.000Z',
      candidates: [],
      deleted: [],
      skippedInProgress: [],
      unresolved: [],
      discoveryFailed: false,
      ok: true,
    });
  });

  it('never asks CloudFormation to force-delete a stack', async () => {
    // Prepare
    const stub = createStub({
      pages: [
        { Stacks: [makeStack('Alpha'), makeStack('LmiShared-1234-x86')] },
      ],
      recheck: {
        Alpha: makeStack('Alpha', { StackStatus: 'DELETE_FAILED' }),
      },
    });
    const attempts: string[] = [];
    const failFirstAttempt: StackDeleteWaiter = vi.fn(
      async (_client, stackId) => {
        const stackName = stackNameOf(stackId);
        if (stackName === 'Alpha' && !attempts.includes(stackName)) {
          attempts.push(stackName);
          throw new Error('Resource is still in use');
        }
      }
    );

    // Act
    await sweep(stub.client, failFirstAttempt);

    // Assess
    expect(stub.deleteInputs).toHaveLength(3);
    for (const input of stub.deleteInputs) {
      // Forcing a delete retains resources CloudFormation cannot delete, which
      // would leave the account dirtier than the stack it removes.
      expect(input.DeletionMode).toBeUndefined();
      expect(input.RetainResources).toBeUndefined();
    }
  });
});
