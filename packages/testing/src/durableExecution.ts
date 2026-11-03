import {
  type Event,
  GetDurableExecutionCommand,
  type GetDurableExecutionCommandOutput,
  GetDurableExecutionHistoryCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import { fromUtf8 } from '@smithy/util-utf8';

const lambdaClient = new LambdaClient({});

/**
 * Starts a durable execution of a Lambda function without waiting for it to complete.
 *
 * The function is invoked asynchronously, so that more executions can start
 * while this one runs or is suspended.
 *
 * @param options - the options to start the execution
 * @param options.functionName - the name of the function, qualified with a version or `$LATEST`
 * @param options.executionName - the unique name of the execution
 * @param options.payload - the input of the execution
 */
const startDurableExecution = async ({
  functionName,
  executionName,
  payload = {},
}: {
  functionName: string;
  executionName: string;
  payload?: unknown;
}): Promise<string> => {
  const result = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'Event',
      DurableExecutionName: executionName,
      Payload: fromUtf8(JSON.stringify(payload)),
    })
  );
  if (result.DurableExecutionArn === undefined) {
    throw new Error(
      `Function ${functionName} did not start a durable execution`
    );
  }

  return result.DurableExecutionArn;
};

/**
 * Waits until a durable execution is no longer running and returns it.
 *
 * An execution started asynchronously can take a moment to become visible,
 * so the execution not being found yet is retried until the timeout.
 *
 * @param options - the options to wait for the execution
 * @param options.durableExecutionArn - the ARN of the execution
 * @param options.timeoutMs - how long to wait before failing, 3 minutes by default
 * @param options.intervalMs - how long to wait between two checks, 1 second by default
 */
const waitForDurableExecution = async ({
  durableExecutionArn,
  timeoutMs = 180_000,
  intervalMs = 1_000,
}: {
  durableExecutionArn: string;
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<GetDurableExecutionCommandOutput> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const execution = await lambdaClient.send(
        new GetDurableExecutionCommand({
          DurableExecutionArn: durableExecutionArn,
        })
      );
      if (execution.Status !== 'RUNNING') {
        return execution;
      }
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.name !== 'ResourceNotFoundException'
      ) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `Durable execution ${durableExecutionArn} was still running after ${timeoutMs} ms`
  );
};

/**
 * Gets all the events in the history of a durable execution, including their data.
 *
 * @param durableExecutionArn - the ARN of the execution
 */
const getDurableExecutionHistory = async (
  durableExecutionArn: string
): Promise<Event[]> => {
  const events: Event[] = [];
  let marker: string | undefined;
  do {
    const page = await lambdaClient.send(
      new GetDurableExecutionHistoryCommand({
        DurableExecutionArn: durableExecutionArn,
        IncludeExecutionData: true,
        Marker: marker,
      })
    );
    events.push(...(page.Events ?? []));
    marker = page.NextMarker;
  } while (marker);

  return events;
};

export {
  getDurableExecutionHistory,
  startDurableExecution,
  waitForDurableExecution,
};
