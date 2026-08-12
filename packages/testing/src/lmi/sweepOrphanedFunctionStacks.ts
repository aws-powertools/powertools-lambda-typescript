import {
  CloudFormationClient,
  DeleteStackCommand,
  ListStacksCommand,
  type StackSummary,
  waitUntilStackDeleteComplete,
} from '@aws-sdk/client-cloudformation';
import { lmiFunctionStackTestName } from './naming.js';

/**
 * Stack statuses that represent a live (or half-deleted) stack still holding
 * resources. `DELETE_COMPLETE` stacks are excluded from the listing so the
 * sweep only ever acts on stacks that still exist.
 */
const ACTIVE_STACK_STATUS_FILTER = [
  'CREATE_IN_PROGRESS',
  'CREATE_FAILED',
  'CREATE_COMPLETE',
  'ROLLBACK_IN_PROGRESS',
  'ROLLBACK_FAILED',
  'ROLLBACK_COMPLETE',
  'DELETE_FAILED',
  'UPDATE_IN_PROGRESS',
  'UPDATE_COMPLETE',
  'UPDATE_ROLLBACK_IN_PROGRESS',
  'UPDATE_ROLLBACK_FAILED',
  'UPDATE_ROLLBACK_COMPLETE',
] as const;

/**
 * Delete any per-suite LMI function stacks left over from this workflow run.
 *
 * Each LMI suite deploys a function stack whose function is attached to the
 * shared capacity provider by ARN. That relationship crosses stacks and is
 * invisible to CloudFormation, so a function stack orphaned by a cancelled or
 * timed-out cell keeps the capacity provider's ENIs in use and makes the
 * subsequent provider-stack delete fail with `DELETE_FAILED`.
 *
 * The teardown job therefore sweeps these function stacks (identified by the
 * run-scoped `Lmi-<runId>` marker in their name) and waits for them to be
 * gone before deleting the provider stacks. On a healthy run this is a no-op:
 * each suite's own `afterAll` has already deleted its stack.
 *
 * Returns the names of the stacks it deleted.
 */
const sweepOrphanedFunctionStacks = async (
  client: CloudFormationClient = new CloudFormationClient({})
): Promise<string[]> => {
  const nameToken = lmiFunctionStackTestName();

  const orphaned: StackSummary[] = [];
  let nextToken: string | undefined;
  do {
    const page = await client.send(
      new ListStacksCommand({
        StackStatusFilter: [...ACTIVE_STACK_STATUS_FILTER],
        NextToken: nextToken,
      })
    );
    for (const summary of page.StackSummaries ?? []) {
      if (summary.StackName?.includes(nameToken)) {
        orphaned.push(summary);
      }
    }
    nextToken = page.NextToken;
  } while (nextToken);

  const deleted = await Promise.all(
    orphaned.map(async (stack) => {
      const stackName = stack.StackName as string;
      await client.send(new DeleteStackCommand({ StackName: stackName }));
      await waitUntilStackDeleteComplete(
        { client, maxWaitTime: 600 },
        { StackName: stack.StackId ?? stackName }
      );
      return stackName;
    })
  );

  return deleted;
};

export { sweepOrphanedFunctionStacks };
