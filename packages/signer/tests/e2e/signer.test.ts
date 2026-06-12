import { join } from 'node:path';
import {
  invokeFunctionOnce,
  TestInvocationLogs,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SignerTestFunction } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  STACK_OUTPUT_FUNCTION_NAME,
} from './constants.js';

const lambdaFunctionCodeFilePath = join(
  __dirname,
  'signer.test.functionCode.ts'
);

/**
 * End-to-end tests for the signer.
 *
 * Deploys a caller Lambda that uses the signer, plus an IAM-protected REST API
 * (mock integration). The caller signs requests against the API and reports the
 * resulting status codes; the test parses those from the function's logs.
 *
 * This validates that signing works in a live Lambda using the execution-role
 * credentials read from the runtime environment (incl. `AWS_SESSION_TOKEN`),
 * that unsigned requests are denied, and that the documented error behaviour
 * holds.
 */
describe('Signer E2E tests', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'SignedRequests',
    },
  });

  let results: Record<string, unknown>;

  beforeAll(async () => {
    // Prepare
    new SignerTestFunction(
      testStack,
      { entry: lambdaFunctionCodeFilePath },
      { nameSuffix: STACK_OUTPUT_FUNCTION_NAME }
    );

    // Act
    await testStack.deploy();

    const functionName = testStack.findAndGetStackOutputValue(
      STACK_OUTPUT_FUNCTION_NAME
    );
    const logs = await invokeFunctionOnce({ functionName });

    // The handler logs a single JSON line with all check results.
    const functionLogs = logs.getFunctionLogs();
    results = TestInvocationLogs.parseFunctionLog(
      functionLogs[functionLogs.length - 1]
    ) as Record<string, unknown>;
  });

  it('denies an unsigned request', () => {
    expect(results.unsignedGet).toBe(403);
  });

  it('signs a GET request with the fetcher and with sign()', () => {
    expect(results.signedFetcherGet).toBe(200);
    expect(results.signedManualGet).toBe(200);
  });

  it('signs a request with a body', () => {
    expect(results.signedPost).toBe(200);
  });

  it('signs a request with query-string parameters', () => {
    expect(results.signedQuery).toBe(200);
  });

  it('reuses a single signer instance across requests', () => {
    expect(results.signerReuseAllOk).toBe(true);
  });

  it('works as a drop-in fetch for other clients', () => {
    expect(results.dropInClientGet).toBe(200);
  });

  it('honours an explicit, correct region', () => {
    expect(results.explicitRegionGet).toBe(200);
  });

  it('denies a request signed for the wrong region', () => {
    expect(results.wrongRegionGet).toBe(403);
  });

  it('honours explicit static credentials', () => {
    expect(results.staticCredentialsGet).toBe(200);
  });

  it('throws a RequestSigningError for an unreadable body', () => {
    expect(results.streamingError).toBe('RequestSigningError');
    expect(results.streamingErrorIsSignerError).toBe(true);
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
