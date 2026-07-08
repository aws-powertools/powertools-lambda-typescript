import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/**
 * How often the CDK toolkit polls `DescribeStackEvents` for each in-flight
 * stack operation once patched. The default is 2s; our e2e `ioHost` only
 * surfaces progress every 10s anyway, so nothing is lost by polling slower.
 */
const PATCHED_POLLING_INTERVAL_MS = 10_000;

let patched = false;

/**
 * Slow down the CDK toolkit's CloudFormation stack-event polling.
 *
 * `@aws-cdk/toolkit-lib` polls `DescribeStackEvents` every 2s per active stack
 * operation and exposes no way to configure this. During e2e runs the CI matrix
 * deploys/destroys dozens of stacks concurrently, which saturates the
 * account-level CloudFormation read API rate and randomly fails jobs with
 * `Throttling: Rate exceeded` (CDK_TOOLKIT_E5500/E7900).
 *
 * Until the interval is configurable upstream, we reach into the toolkit's
 * internals and raise it on every monitor before it starts. The patch is a
 * no-op (with a warning) if the internal module moves in a future release.
 */
const patchCdkStackEventPolling = (): void => {
  if (patched) return;
  patched = true;
  try {
    const cjsRequire = createRequire(join(process.cwd(), 'index.js'));
    const toolkitRoot = dirname(
      cjsRequire.resolve('@aws-cdk/toolkit-lib/package.json')
    );
    const { StackActivityMonitor } = cjsRequire(
      join(
        toolkitRoot,
        'lib',
        'api',
        'stack-events',
        'stack-activity-monitor.js'
      )
    ) as {
      StackActivityMonitor: {
        prototype: {
          pollingInterval: number;
          start: (...args: unknown[]) => unknown;
        };
      };
    };
    const originalStart = StackActivityMonitor.prototype.start;
    StackActivityMonitor.prototype.start = function (
      this: { pollingInterval: number },
      ...args: unknown[]
    ) {
      this.pollingInterval = PATCHED_POLLING_INTERVAL_MS;
      return originalStart.apply(this, args);
    };
  } catch (error) {
    console.warn(
      'Unable to patch @aws-cdk/toolkit-lib stack-event polling interval; e2e runs may hit CloudFormation throttling',
      error
    );
  }
};

export { PATCHED_POLLING_INTERVAL_MS, patchCdkStackEventPolling };
