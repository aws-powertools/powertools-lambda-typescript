import { setTimeout } from 'node:timers/promises';

/**
 * Tees `process.stdout` and collects every chunk that parses as a JSON object,
 * passing all chunks through to the original stream.
 *
 * On Lambda Managed Instances the Invoke API does not support Tail logs and
 * CloudWatch delivery is asynchronous, so a handler that returns its captured
 * output in the response payload is the only fully deterministic way for an
 * e2e test to read what the utility under test wrote. Powertools utilities
 * write each log line or EMF payload as a single write to `process.stdout`
 * through their own `Console` instance, bypassing Lambda's patched global
 * console, so intercepting the stream captures the real production write path.
 *
 * Call once at module scope. The returned array is shared by every invocation
 * of the execution environment, so filter it by an invocation-specific key.
 *
 * @example
 * ```ts
 * const capturedLogs = captureJsonStdout<{ function_request_id?: string }>();
 *
 * export const handler = async (event, context) => {
 *   logger.info('hello');
 *   return {
 *     logs: capturedLogs.filter(
 *       (log) => log.function_request_id === context.awsRequestId
 *     ),
 *   };
 * };
 * ```
 *
 * @typeParam T - Shape of the parsed objects
 */
const captureJsonStdout = <
  T extends object = Record<string, unknown>,
>(): T[] => {
  const captured: T[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
    try {
      const parsed = JSON.parse(chunk.toString());
      if (typeof parsed === 'object' && parsed !== null) {
        captured.push(parsed);
      }
    } catch {
      // not a JSON line, ignore
    }
    // @ts-expect-error - passing through the remaining overloaded args as-is
    return originalWrite(chunk, ...rest);
    // The tee only forwards to the original write, so it keeps its overloads
  }) as typeof process.stdout.write;

  return captured;
};

/**
 * Creates a barrier that proves two invocations overlapped in the same
 * execution environment.
 *
 * Invocations multiplexed into one environment share module scope, so the
 * returned function counts in-flight callers and blocks each of them until a
 * second one arrives or the timeout elapses. It resolves to `true` when a peer
 * was observed and `false` when the invocation stayed alone. Once every caller
 * has left, the barrier resets for the next batch.
 *
 * Call once at module scope and await the returned function inside the
 * handler, after storing the invocation-scoped state whose isolation the test
 * checks, so that overlapping invocations hold that state at the same time.
 *
 * @example
 * ```ts
 * const awaitPeer = createPeerBarrier();
 *
 * export const handler = async (event) => {
 *   logger.appendKeys({ invocationKey: event.invocationId });
 *   const sawPeer = await awaitPeer();
 *   logger.info('LMI isolation test');
 *   return { sawPeer };
 * };
 * ```
 *
 * @param {Object} options - Options to create the barrier
 * @param {number} options.timeoutMs - How long to wait for a peer before giving up, defaults to 15 seconds
 */
const createPeerBarrier = ({
  timeoutMs = 15_000,
}: {
  timeoutMs?: number;
} = {}): (() => Promise<boolean>) => {
  let inFlight = 0;
  let barrier = Promise.withResolvers<void>();

  return async () => {
    inFlight++;
    if (inFlight >= 2) {
      barrier.resolve();
    }
    const sawPeer = await Promise.race([
      barrier.promise.then(() => true),
      setTimeout(timeoutMs, false),
    ]);
    inFlight--;
    if (inFlight === 0) {
      barrier = Promise.withResolvers<void>();
    }

    return sawPeer;
  };
};

export { captureJsonStdout, createPeerBarrier };
