import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStacksCommand,
  type Stack,
  waitUntilStackDeleteComplete,
} from '@aws-sdk/client-cloudformation';

/**
 * The tag every stack deployed by `TestStack` carries. An exact key/value match
 * is the primary signal that a stack belongs to the e2e test suite and can be
 * swept; anything else in the account is left alone.
 */
const E2E_TAG_KEY = 'Service';
const E2E_TAG_VALUE = 'Powertools-for-AWS-e2e-tests';

/**
 * The run-scoped LMI shared capacity provider stacks (`LmiShared-<runId>-...`)
 * are matched by name as well as by tag: they are the only stacks other stacks
 * depend on, so they must be recognisable even if a future change stops tagging
 * them, and they must always be deleted *after* the function stacks that attach
 * to them by ARN (a relationship CloudFormation cannot see).
 */
const LMI_SHARED_STACK_NAME_PREFIX = 'LmiShared-';

/**
 * A stack must be at least this old to be considered abandoned. E2E jobs finish
 * well within a couple of hours, so 12h is far outside any legitimate run and
 * guarantees the sweeper can never race a live workflow. There are no
 * exemptions: a stack younger than this is never deleted, even when it is what
 * keeps an older stack from being deleted.
 */
const MIN_STACK_AGE_HOURS = 12;

/**
 * How many stack deletions may be in flight within a single phase. Deletions
 * are cheap to issue but each one polls `DescribeStacks` until it completes, so
 * the cap keeps the sweep from tripping the account-wide CloudFormation read
 * rate limit (which surfaces as `Throttling: Rate exceeded`).
 */
const MAX_CONCURRENT_DELETIONS = 5;

/**
 * How long to wait for a single stack delete to reach `DELETE_COMPLETE`.
 * Stacks holding VPC-attached Lambda functions can take ~15 minutes to release
 * their ENIs, so anything below 20 minutes would report healthy deletions as
 * failures.
 */
const STACK_DELETE_MAX_WAIT_SECONDS = 20 * 60;

/**
 * Statuses that mean CloudFormation is mid-operation on the stack. These are
 * never deleted: a `DeleteStack` call would either fail or fight an operation
 * that may still be a live workflow's, so they are reported for a human to look
 * at instead.
 */
const isInProgress = (status: string): boolean =>
  status.endsWith('_IN_PROGRESS');

/**
 * A candidate stack, as selected by {@link discoverStaleStacks | discovery}.
 *
 * `stackId` is kept alongside the name because the delete waiter must poll by
 * id: `DescribeStacks` by *name* stops resolving once the stack is gone, so a
 * name-based waiter never observes `DELETE_COMPLETE`.
 */
type StaleStackCandidate = {
  stackName: string;
  stackId: string;
  status: string;
  ageHours: number;
  reason: 'tag' | 'lmi-shared-name';
};

/**
 * The machine-readable report the sweeper writes to stdout. The e2e sweeper
 * workflow parses it to build its job summary, so the shape is a contract:
 * fields are only ever added, never renamed or removed.
 */
type SweepReport = {
  dryRun: boolean;
  timestamp: string;
  candidates: {
    stackName: string;
    status: string;
    ageHours: number;
    reason: StaleStackCandidate['reason'];
  }[];
  deleted: string[];
  skippedInProgress: { stackName: string; status: string }[];
  unresolved: { stackName: string; status: string; reason: string }[];
  discoveryFailed: boolean;
  ok: boolean;
};

/**
 * Waits for a stack delete to complete. Injectable so unit tests don't have to
 * poll a real (or mocked) `DescribeStacks` on a timer.
 */
type StackDeleteWaiter = (
  client: CloudFormationClient,
  stackId: string
) => Promise<void>;

type SweepStaleStacksOptions = {
  /**
   * The CloudFormation client to use. By default the region and credentials
   * come from the AWS SDK default provider chain, i.e. from the environment the
   * workflow sets up.
   */
  client?: CloudFormationClient;
  /**
   * The instant the sweep is anchored to, as epoch milliseconds. Injectable so
   * the age gate is deterministic in tests.
   */
  now?: number;
  /**
   * When `true`, discover and select candidates but issue no `DeleteStack`
   * call.
   */
  dryRun?: boolean;
  waiter?: StackDeleteWaiter;
  /**
   * Where human-readable progress goes. Defaults to `console.error` so stdout
   * stays reserved for the JSON report.
   */
  log?: (message: string) => void;
};

const defaultWaiter: StackDeleteWaiter = async (client, stackId) => {
  await waitUntilStackDeleteComplete(
    { client, maxWaitTime: STACK_DELETE_MAX_WAIT_SECONDS },
    { StackName: stackId }
  );
};

/**
 * Strip anything that identifies the AWS account from text that ends up in the
 * report, which is published to a public workflow run: ARNs first (they embed
 * the account id), then any bare 12-digit number.
 */
const sanitize = (value: string): string =>
  value
    .replaceAll(/arn:[^\s"']+/g, '[REDACTED]')
    .replaceAll(/\d{12}/g, '[REDACTED]');

const describeError = (error: unknown): string =>
  sanitize(error instanceof Error ? error.message : String(error));

const isLmiSharedStack = (stackName: string): boolean =>
  stackName.startsWith(LMI_SHARED_STACK_NAME_PREFIX);

const hasE2eTag = (stack: Stack): boolean =>
  (stack.Tags ?? []).some(
    (tag) => tag.Key === E2E_TAG_KEY && tag.Value === E2E_TAG_VALUE
  );

/**
 * Decide whether a described stack is a sweep candidate, and why.
 *
 * All of the following must hold:
 * - it is a root stack: nested stacks are deleted by their parent, and deleting
 *   one directly fails;
 * - it was created more than {@link MIN_STACK_AGE_HOURS} ago, computed from
 *   `CreationTime` (a stack without one is never swept, because its age cannot
 *   be proven);
 * - it carries the exact e2e `Service` tag, or its name marks it as a shared
 *   LMI stack.
 *
 * `DELETE_COMPLETE` stacks are dropped as well; `DescribeStacks` without a
 * stack name does not return them, but a re-check by id does.
 */
const selectCandidate = (
  stack: Stack,
  now: number
): StaleStackCandidate | undefined => {
  const { StackName: stackName, StackId: stackId, StackStatus: status } = stack;
  if (!stackName || !stackId || !status || status === 'DELETE_COMPLETE') {
    return undefined;
  }
  if (stack.RootId || stack.ParentId) {
    return undefined;
  }
  if (!stack.CreationTime) {
    return undefined;
  }

  const ageHours = (now - stack.CreationTime.getTime()) / 3_600_000;
  if (ageHours <= MIN_STACK_AGE_HOURS) {
    return undefined;
  }

  const reason = hasE2eTag(stack)
    ? 'tag'
    : isLmiSharedStack(stackName)
      ? 'lmi-shared-name'
      : undefined;
  if (!reason) {
    return undefined;
  }

  return {
    stackName,
    stackId,
    status,
    // Rounded for the report only; the age gate above uses the exact value.
    ageHours: Math.round(ageHours * 10) / 10,
    reason,
  };
};

/**
 * Page through every stack in the account and return the stale ones.
 *
 * `DescribeStacks` is used rather than `ListStacks` because it returns `Tags`,
 * `CreationTime`, `RootId` and `StackId` in the same response, so selection
 * needs no per-stack follow-up call — which both halves the API calls and
 * removes the window in which a stack could change underneath us.
 *
 * Any error propagates: discovery is all-or-nothing, because deleting from a
 * half-built candidate list could delete a shared stack while the function
 * stacks depending on it are still unknown.
 */
const discoverStaleStacks = async (
  client: CloudFormationClient,
  now: number
): Promise<StaleStackCandidate[]> => {
  const candidates: StaleStackCandidate[] = [];
  let nextToken: string | undefined;
  do {
    const page = await client.send(
      new DescribeStacksCommand({ NextToken: nextToken })
    );
    for (const stack of page.Stacks ?? []) {
      const candidate = selectCandidate(stack, now);
      if (candidate) {
        candidates.push(candidate);
      }
    }
    nextToken = page.NextToken;
  } while (nextToken);

  // Sorted so the report reads the same way for the same account state.
  return candidates.sort((a, b) => a.stackName.localeCompare(b.stackName));
};

/**
 * Run `worker` over `items` with at most `limit` calls in flight, preserving
 * the input order in the results.
 *
 * A handful of long-lived promises pulling from a shared cursor is all the
 * limiter this needs, and it keeps the package free of another dependency.
 */
const mapWithConcurrency = async <TItem, TResult>(
  items: TItem[],
  limit: number,
  worker: (item: TItem) => Promise<TResult>
): Promise<TResult[]> => {
  const results = new Array<TResult>(items.length);
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      let index = cursor++;
      while (index < items.length) {
        results[index] = await worker(items[index]);
        index = cursor++;
      }
    }
  );
  await Promise.all(runners);

  return results;
};

type DeletionOutcome = {
  candidate: StaleStackCandidate;
  deleted: boolean;
  failureReason?: string;
};

/**
 * Delete a single stack and wait for it to be gone.
 *
 * The stack *id* is used for both the delete and the wait: it pins the
 * operation to the exact stack discovery selected (a name could in principle
 * have been reused since), and it is the only form `DescribeStacks` keeps
 * resolving after the stack is gone, which the waiter needs to ever see
 * `DELETE_COMPLETE`.
 *
 * Deletion is never forced (`DeletionMode: FORCE_DELETE_STACK`): retaining
 * resources that CloudFormation cannot delete would leave the account dirtier
 * than the stack itself, so a stack that will not delete is reported instead.
 *
 * Failures are captured rather than thrown so one stuck stack cannot stop the
 * rest of the sweep.
 */
const deleteStack = async (
  client: CloudFormationClient,
  candidate: StaleStackCandidate,
  waiter: StackDeleteWaiter,
  log: (message: string) => void
): Promise<DeletionOutcome> => {
  log(`Deleting ${candidate.stackName} (${candidate.status})`);
  try {
    await client.send(new DeleteStackCommand({ StackName: candidate.stackId }));
    await waiter(client, candidate.stackId);
    log(`Deleted ${candidate.stackName}`);

    return { candidate, deleted: true };
  } catch (error) {
    const failureReason = describeError(error);
    log(`Failed to delete ${candidate.stackName}: ${failureReason}`);

    return { candidate, deleted: false, failureReason };
  }
};

/**
 * One dependency-ordered deletion pass: every stack that is not a shared LMI
 * stack first, then — once those are all gone — the shared ones.
 *
 * The ordering exists because a function stack's function attaches to a shared
 * capacity provider by ARN. CloudFormation does not know about that link, so
 * deleting the provider stack first fails on ENIs still in use.
 */
const runDeletionPass = async (
  client: CloudFormationClient,
  candidates: StaleStackCandidate[],
  waiter: StackDeleteWaiter,
  log: (message: string) => void
): Promise<DeletionOutcome[]> => {
  const phases = [
    candidates.filter(({ stackName }) => !isLmiSharedStack(stackName)),
    candidates.filter(({ stackName }) => isLmiSharedStack(stackName)),
  ];

  const outcomes: DeletionOutcome[] = [];
  for (const phase of phases) {
    if (phase.length === 0) {
      continue;
    }
    outcomes.push(
      ...(await mapWithConcurrency(
        phase,
        MAX_CONCURRENT_DELETIONS,
        async (candidate) => deleteStack(client, candidate, waiter, log)
      ))
    );
  }

  return outcomes;
};

type RecheckResult = {
  /** Stacks that are gone after all, despite the first pass reporting them as failed. */
  gone: StaleStackCandidate[];
  /** Stacks that still exist and can be deleted again. */
  retryable: StaleStackCandidate[];
  /** Stacks that exist but must not be touched, with their current status. */
  untouchable: StaleStackCandidate[];
};

/**
 * Re-read the state of the stacks the first pass could not delete.
 *
 * The most common first-pass failure is a stack that depends on another one in
 * the same batch, so by the time the batch is over it is either already gone or
 * finally deletable. Re-checking before retrying avoids reporting a stack that
 * did delete, and avoids calling `DeleteStack` on a stack that has since entered
 * an operation of its own.
 *
 * A stack that no longer resolves is treated as deleted. Any other describe
 * error (a throttle, say) leaves the stack in the retry list: retrying costs
 * one call and the retry's own failure is reported if it doesn't help.
 */
const recheckFailedStacks = async (
  client: CloudFormationClient,
  candidates: StaleStackCandidate[]
): Promise<RecheckResult> => {
  const result: RecheckResult = { gone: [], retryable: [], untouchable: [] };
  for (const candidate of candidates) {
    let current: Stack | undefined;
    try {
      const { Stacks: stacks } = await client.send(
        new DescribeStacksCommand({ StackName: candidate.stackId })
      );
      current = stacks?.at(0);
      if (!current) {
        result.gone.push(candidate);
        continue;
      }
    } catch (error) {
      if (describeError(error).includes('does not exist')) {
        result.gone.push(candidate);
      } else {
        result.retryable.push(candidate);
      }
      continue;
    }

    const status = current.StackStatus ?? candidate.status;
    if (status === 'DELETE_COMPLETE') {
      result.gone.push(candidate);
      continue;
    }
    // `DELETE_IN_PROGRESS` is retryable: the delete we issued is simply still
    // running, and re-issuing it is a no-op that lets us wait again. Any other
    // in-progress status belongs to an operation we did not start.
    if (isInProgress(status) && status !== 'DELETE_IN_PROGRESS') {
      result.untouchable.push({ ...candidate, status });
      continue;
    }
    result.retryable.push({ ...candidate, status });
  }

  return result;
};

const toReportCandidate = ({
  stackName,
  status,
  ageHours,
  reason,
}: StaleStackCandidate): SweepReport['candidates'][number] => ({
  stackName,
  status,
  ageHours,
  reason,
});

/**
 * An empty report: nothing found, nothing done, not `ok`. Every sweep starts
 * from this and fills it in, and the CLI falls back to it when the sweep itself
 * blows up, so the workflow always gets a report in the agreed shape.
 */
const createEmptyReport = (dryRun: boolean, now = Date.now()): SweepReport => ({
  dryRun,
  timestamp: new Date(now).toISOString(),
  candidates: [],
  deleted: [],
  skippedInProgress: [],
  unresolved: [],
  discoveryFailed: false,
  ok: false,
});

/**
 * Delete the CloudFormation stacks left behind by e2e test runs, and report
 * what happened.
 *
 * A cancelled or timed-out e2e job never runs its own teardown, so its stacks
 * stay in the account forever and eventually collide with account limits. This
 * sweep is the safety net: it deletes stacks that are provably abandoned — root
 * stacks, older than {@link MIN_STACK_AGE_HOURS}, tagged as e2e test stacks (or
 * named as shared LMI stacks) — and nothing else.
 *
 * The sweep is deliberately staged:
 * 1. discovery runs to completion before anything is deleted, so a partial
 *    listing can never cause a partial (and out-of-order) deletion;
 * 2. deletion runs as two {@link runDeletionPass | dependency-ordered passes},
 *    because cross-stack dependencies that CloudFormation cannot see make some
 *    first-pass failures expected;
 * 3. whatever is still there afterwards is reported as `unresolved` for a human
 *    to deal with, never force-deleted.
 *
 * The returned report is the workflow's contract. `ok` is `false` whenever the
 * account was left in a state a human should look at: a discovery failure,
 * anything unresolved, or a candidate skipped because CloudFormation was busy
 * with it. A dry run is `ok` unless discovery itself failed — it changes
 * nothing, so there is nothing to fail.
 */
const sweepStaleStacks = async ({
  client = new CloudFormationClient({}),
  now = Date.now(),
  dryRun = false,
  waiter = defaultWaiter,
  log = (message: string) => {
    console.error(message);
  },
}: SweepStaleStacksOptions = {}): Promise<SweepReport> => {
  const report: SweepReport = createEmptyReport(dryRun, now);

  let candidates: StaleStackCandidate[];
  try {
    candidates = await discoverStaleStacks(client, now);
  } catch (error) {
    log(`Discovery failed, no stack was deleted: ${describeError(error)}`);
    report.discoveryFailed = true;

    return report;
  }

  report.candidates = candidates.map(toReportCandidate);
  log(`Found ${candidates.length} stale stack(s)`);

  const deletable: StaleStackCandidate[] = [];
  for (const candidate of candidates) {
    if (isInProgress(candidate.status)) {
      log(
        `Skipping ${candidate.stackName}: CloudFormation is busy with it (${candidate.status})`
      );
      report.skippedInProgress.push({
        stackName: candidate.stackName,
        status: candidate.status,
      });
      continue;
    }
    deletable.push(candidate);
  }

  if (dryRun) {
    log(
      `Dry run: would delete ${deletable.length} stack(s): ${deletable.map(({ stackName }) => stackName).join(', ')}`
    );
    report.ok = true;

    return report;
  }

  const deleted = new Set<string>();
  const firstPass = await runDeletionPass(client, deletable, waiter, log);
  const failed: StaleStackCandidate[] = [];
  for (const outcome of firstPass) {
    if (outcome.deleted) {
      deleted.add(outcome.candidate.stackName);
      continue;
    }
    failed.push(outcome.candidate);
  }

  const unresolved = new Map<string, SweepReport['unresolved'][number]>();
  if (failed.length > 0) {
    log(`Retrying ${failed.length} stack(s) that did not delete`);
    const { gone, retryable, untouchable } = await recheckFailedStacks(
      client,
      failed
    );
    for (const candidate of gone) {
      deleted.add(candidate.stackName);
    }
    for (const candidate of untouchable) {
      unresolved.set(candidate.stackName, {
        stackName: candidate.stackName,
        status: candidate.status,
        reason: `CloudFormation is busy with the stack (${candidate.status}), it was not deleted again`,
      });
    }
    for (const outcome of await runDeletionPass(
      client,
      retryable,
      waiter,
      log
    )) {
      if (outcome.deleted) {
        deleted.add(outcome.candidate.stackName);
        continue;
      }
      unresolved.set(outcome.candidate.stackName, {
        stackName: outcome.candidate.stackName,
        status: outcome.candidate.status,
        reason: outcome.failureReason ?? 'Unknown failure',
      });
    }
  }

  report.deleted = [...deleted].sort((a, b) => a.localeCompare(b));
  report.unresolved = [...unresolved.values()].sort((a, b) =>
    a.stackName.localeCompare(b.stackName)
  );
  report.ok =
    report.unresolved.length === 0 && report.skippedInProgress.length === 0;

  return report;
};

export {
  createEmptyReport,
  MAX_CONCURRENT_DELETIONS,
  MIN_STACK_AGE_HOURS,
  type StackDeleteWaiter,
  type SweepReport,
  type SweepStaleStacksOptions,
  sweepStaleStacks,
};
