import { Console } from 'node:console';

/**
 * A tiny logger that logs to stdout and stderr.
 *
 * This is used to log the results of the function code during the integration tests.
 * We use this instead of the global console object because we want to log pure JSON objects.
 * In Node.js runtimes, AWS Lambda usually patches the global console object to inject some
 * metadata like the request ID. This is not desirable in our case because we want to log pure
 * JSON objects to stdout and stderr.
 *
 * This allows us to get the logs when invoking the function and parse them to verify that
 * the function code is working as expected.
 */
export class TinyLogger {
  private console = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
  });

  public log(message: unknown): void {
    this.console.log(JSON.stringify(message));
  }
}
