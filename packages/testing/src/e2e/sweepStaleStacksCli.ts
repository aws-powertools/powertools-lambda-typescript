import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { createEmptyReport, sweepStaleStacks } from './sweepStaleStacks.js';

/**
 * Entry point for the scheduled e2e stale stack sweeper.
 *
 * Run it from the workflow (or locally, against whatever account the AWS SDK
 * default provider chain resolves to) with:
 * ```yaml
 * - run: npm run e2e:sweep -w packages/testing
 *   env:
 *     AWS_REGION: eu-west-1
 *     DRY_RUN: 'true' # anything other than the exact string 'true' is a real run
 * ```
 *
 * The two output streams are strictly separated so the workflow can consume
 * both: **stdout carries exactly one line**, the JSON
 * {@link sweepStaleStacks | sweep report}, while all human-readable progress
 * goes to stderr. The report is always printed, including when the sweep did
 * not go well and the process exits non-zero.
 *
 * No region is configured here on purpose: the client picks it up from the
 * environment, so the same script sweeps whichever region the caller points it
 * at.
 */
const main = async (): Promise<void> => {
  const dryRun = process.env.DRY_RUN === 'true';
  const report = await sweepStaleStacks({
    client: new CloudFormationClient({}),
    dryRun,
  });

  process.stdout.write(`${JSON.stringify(report)}\n`);
  process.exitCode = report.ok ? 0 : 1;
};

main().catch((error) => {
  // Everything the sweep expects to go wrong is already in the report, so
  // getting here means the sweeper itself broke. The workflow still needs a
  // report to parse, so emit an empty failed one and let the logs carry the
  // detail.
  console.error(error);
  const report = createEmptyReport(process.env.DRY_RUN === 'true');
  report.discoveryFailed = true;
  process.stdout.write(`${JSON.stringify(report)}\n`);
  process.exitCode = 1;
});
