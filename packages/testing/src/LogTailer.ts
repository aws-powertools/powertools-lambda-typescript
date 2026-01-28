import {
  CloudWatchLogsClient,
  StartLiveTailCommand,
  type StartLiveTailCommandOutput,
} from '@aws-sdk/client-cloudwatch-logs';
import type { LogTailerOptions, ParsedLog, SessionResult } from './types.js';

/**
 * Real-time log tailer for AWS Lambda functions using CloudWatch Logs Live Tail API.
 *
 * Captures and organizes Lambda logs by request ID for integration testing.
 * Supports both manual start/stop control and automatic completion detection.
 *
 * @example
 * ```typescript
 * // Manual control
 * const tailer = new LogTailer('/aws/lambda/my-function');
 * await tailer.start();
 * await invokeMyFunction();
 * const logs = await tailer.stop();
 *
 * // Automatic with expected invocations
 * const tailer = new LogTailer('/aws/lambda/my-function', { expectedInvocations: 2 });
 * const logs = await tailer.collectLogs(async () => {
 *   await invokeMyFunction();
 *   await invokeMyFunction();
 * });
 *
 * // Make assertions on collected logs
 * for (const [requestId, entries] of logs.entries()) {
 *   const functionLogs = entries.filter(e => !e.type);
 *   const errors = entries.filter(e => e.message.includes('ERROR'));
 * }
 * ```
 */
class LogTailer {
  #client: CloudWatchLogsClient;
  #logGroupIdentifier: string;
  #options: Required<LogTailerOptions>;
  #response?: StartLiveTailCommandOutput;
  #tailPromise?: Promise<Map<string, ParsedLog[]>>;

  /**
   * Creates a new LogTailer instance.
   *
   * @param logGroupIdentifier - CloudWatch log group name (e.g., '/aws/lambda/my-function') or ARN
   * @param options - Configuration options for tailing behavior
   */
  constructor(logGroupIdentifier: string, options: LogTailerOptions = {}) {
    this.#client = new CloudWatchLogsClient({});
    this.#logGroupIdentifier = logGroupIdentifier.endsWith(':*')
      ? logGroupIdentifier.slice(0, -2)
      : logGroupIdentifier;
    this.#options = {
      maxIdleMs: options.maxIdleMs ?? 60000,
      cooldownTicks: options.cooldownTicks ?? 3,
      expectedInvocations: options.expectedInvocations ?? 0,
    };
  }

  /**
   * Starts the live tail session for the configured log group.
   * Must be called before logs can be captured.
   */
  async start(): Promise<void> {
    this.#response = await this.#client.send(
      new StartLiveTailCommand({
        logGroupIdentifiers: [this.#logGroupIdentifier],
      })
    );
    this.#tailPromise = this.#handleResponseAsync();
  }

  /**
   * Stops the live tail session and returns all collected logs grouped by request ID
   * and sorted chronologically.
   */
  public async stop(): Promise<Map<string, ParsedLog[]>> {
    if (!this.#tailPromise) {
      throw new Error('Tailing not started. Call start() first.');
    }
    this.#client.destroy();
    return await this.#tailPromise;
  }

  /**
   * Convenience method that starts tailing, executes a test function, and stops tailing.
   * Automatically waits for the expected number of invocations to complete if specified.
   *
   * @example
   * ```typescript
   * // With known invocation count
   * const logs = await tailer.collectLogs(async () => {
   *   await sqs.sendMessage({ QueueUrl: queueUrl, MessageBody: 'test' }).promise();
   * }, 1);
   *
   * // Wait for logs to stop flowing (useful when invocation count is unknown)
   * const tailer = new LogTailer('/aws/lambda/my-function', { maxIdleMs: 5000 });
   * const logs = await tailer.collectLogs(async () => {
   *   await triggerAsyncProcess();
   * }, undefined, true);
   * ```
   *
   * @param testFn - Async function that triggers Lambda invocations
   * @param expectedInvocations - Override the expectedInvocations option for this call
   * @param waitForIdle - If true, waits for the idle timeout instead of stopping immediately.
   *                      Useful when you don't know how many invocations to expect.
   */
  public async collectLogs({
    testFn,
    expectedInvocations,
    waitForIdle = false,
  }: {
    testFn: () => Promise<void>;
    expectedInvocations?: number;
    waitForIdle?: boolean;
  }): Promise<Map<string, ParsedLog[]>> {
    if (waitForIdle) {
      // When waiting for idle, disable auto-completion logic
      this.#options.expectedInvocations = 0;
    } else if (expectedInvocations) {
      this.#options.expectedInvocations = expectedInvocations;
    }

    await this.start();
    await testFn();

    if (waitForIdle) {
      // Let the idle timer handle termination instead of stopping immediately
      if (!this.#tailPromise) {
        throw new Error('Tailing not started');
      }
      return await this.#tailPromise;
    }

    return await this.stop();
  }

  /**
   * Parses a raw log event from the Live Tail stream into structured data.
   * Extracts request ID, timestamp, and log type from JSON log messages.
   *
   * @param logEvent - Raw log event from the Live Tail session
   */
  #parseLogEvent(logEvent: SessionResult): {
    requestId?: string;
    innerTimestamp?: string;
    type?: string;
    logObj?: ParsedLog;
  } {
    const outerTimestamp = logEvent.timestamp;
    if (outerTimestamp === undefined) return {};

    const message = logEvent.message;
    if (message === undefined) return {};

    let parsed: ParsedLog;
    try {
      parsed =
        typeof message === 'string'
          ? JSON.parse(message)
          : (message as ParsedLog);
    } catch {
      parsed = {};
    }

    const requestId =
      parsed.requestId ||
      parsed.record?.requestId ||
      parsed.function_request_id;
    const innerTimestamp = parsed.timestamp || parsed.time;
    const type = parsed.type || 'application';

    if (!requestId || !innerTimestamp) return {};

    return {
      requestId,
      innerTimestamp,
      type,
      logObj: parsed,
    };
  }

  /**
   * Checks if a Lambda request is complete by verifying both `platform.start` and `platform.report` logs exist.
   *
   * @param logs - Array of log entries for a specific request ID
   */
  #isRequestComplete(logs: ParsedLog[]): boolean {
    let hasStart = false;
    let hasReport = false;
    for (const log of logs) {
      if (log.type === 'platform.start') hasStart = true;
      if (log.type === 'platform.report') hasReport = true;
    }
    return hasStart && hasReport;
  }

  /**
   * Sorts log entries chronologically with platform events properly ordered.
   * Ensures `platform.start` appears first and `platform.report` appears last for same timestamps.
   *
   * @param logs - Array of log entries to sort
   */
  #sortLogs(logs: ParsedLog[]): void {
    logs.sort((a, b) => {
      const aTimestamp = a.timestamp ?? '';
      const bTimestamp = b.timestamp ?? '';
      if (aTimestamp < bTimestamp) return -1;
      if (aTimestamp > bTimestamp) return 1;
      if (a.type === 'platform.start' && b.type !== 'platform.start') return -1;
      if (b.type === 'platform.start' && a.type !== 'platform.start') return 1;
      if (a.type === 'platform.report' && b.type !== 'platform.report')
        return 1;
      if (b.type === 'platform.report' && a.type !== 'platform.report')
        return -1;
      return 0;
    });
  }

  /**
   * Handles the live tail response stream, collecting and organizing logs by request ID.
   * Implements idle timeout and cooldown logic for automatic completion detection.
   */
  async #handleResponseAsync(): Promise<Map<string, ParsedLog[]>> {
    if (!this.#response) {
      throw new Error('No response available');
    }

    const requestLogs: Map<string, ParsedLog[]> = new Map();
    let cooldownCounter = 0;
    let cooldownActive = false;
    let aborted = false;
    let idleTimer: NodeJS.Timeout | undefined;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        this.#client.destroy();
        aborted = true;
      }, this.#options.maxIdleMs);
    };

    resetIdleTimer();

    try {
      for await (const event of this.#response.responseStream || []) {
        if (aborted) break;

        let hadLogData = false;
        if (event.sessionUpdate?.sessionResults?.length) {
          hadLogData = true;
          for (const logEvent of event.sessionUpdate.sessionResults) {
            const { requestId, logObj } = this.#parseLogEvent(logEvent);
            if (!requestId || !logObj) continue;

            if (!requestLogs.has(requestId)) {
              requestLogs.set(requestId, []);
            }
            requestLogs.get(requestId)?.push(logObj);
          }
        }

        if (hadLogData) resetIdleTimer();

        if (
          this.#options.expectedInvocations &&
          requestLogs.size >= this.#options.expectedInvocations
        ) {
          let completeCount = 0;
          for (const logs of requestLogs.values()) {
            if (this.#isRequestComplete(logs)) completeCount++;
          }

          if (completeCount >= this.#options.expectedInvocations) {
            if (!cooldownActive) {
              cooldownActive = true;
              cooldownCounter = 0;
            } else {
              cooldownCounter++;
              if (cooldownCounter >= this.#options.cooldownTicks) {
                this.#client.destroy();
                aborted = true;
                break;
              }
            }
          } else {
            cooldownActive = false;
            cooldownCounter = 0;
          }
        }
      }

      if (idleTimer) clearTimeout(idleTimer);

      for (const logs of requestLogs.values()) {
        this.#sortLogs(logs);
      }

      return requestLogs;
    } catch {
      if (idleTimer) clearTimeout(idleTimer);
      return requestLogs;
    }
  }
}

export { LogTailer };
