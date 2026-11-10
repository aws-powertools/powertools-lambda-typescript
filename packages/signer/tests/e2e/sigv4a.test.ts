import { join } from 'node:path';
import {
  invokeFunctionOnce,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SigV4aSignerTestFunction } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  STACK_OUTPUT_FUNCTION_NAME,
} from './constants.js';

/**
 * Describes the status codes and payload checks returned by the caller Lambda.
 */
interface SigV4aResults {
  put: number;
  get: number;
  bodyMatches: boolean;
  unsigned: number;
  explicitRegion: number;
  regionPattern: number;
  excludedRegion: number;
  keyResults: {
    path: string;
    put: number;
    get: number;
    bodyMatches: boolean;
  }[];
  query: number;
  reuseAllOk: boolean;
}

describe('SigV4a E2E tests', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'SigV4aRequests',
    },
  });
  let results: SigV4aResults;

  beforeAll(async () => {
    // Prepare
    new SigV4aSignerTestFunction(
      testStack,
      { entry: join(__dirname, 'sigv4a.test.functionCode.ts') },
      { nameSuffix: STACK_OUTPUT_FUNCTION_NAME }
    );

    // Act
    await testStack.deploy();
    const functionName = testStack.findAndGetStackOutputValue(
      STACK_OUTPUT_FUNCTION_NAME
    );
    const logs = await invokeFunctionOnce({ functionName });
    const resultLine = logs
      .getFunctionLogs()
      .find((log) => log.includes('"sigv4a"'));
    if (!resultLine) throw new Error('The caller did not log SigV4a results');
    const parsed = JSON.parse(resultLine.slice(resultLine.indexOf('{')));
    results = 'sigv4a' in parsed ? parsed : JSON.parse(parsed.message);
  });

  it('denies an unsigned request', () => {
    // Assess
    expect(results.unsigned).toBe(400);
  });

  it('signs S3 PUT and GET requests with Lambda credentials', () => {
    // Assess
    expect(results.put).toBe(200);
    expect(results.get).toBe(200);
    expect(results.bodyMatches).toBe(true);
  });

  it('accepts an explicit region set containing the bucket region', () => {
    // Assess
    expect(results.explicitRegion).toBe(200);
  });

  it('accepts a region wildcard pattern', () => {
    // Assess
    expect(results.regionPattern).toBe(200);
  });

  it('denies a region set that excludes the bucket region', () => {
    // Assess
    expect(results.excludedRegion).toBe(400);
  });

  it('signs S3 keys with reserved characters, escapes, and repeated slashes', () => {
    // Assess
    expect(results.keyResults).toHaveLength(3);
    for (const result of results.keyResults) {
      expect(result.put, result.path).toBe(200);
      expect(result.get, result.path).toBe(200);
      expect(result.bodyMatches, result.path).toBe(true);
    }
  });

  it('signs query parameters', () => {
    // Assess
    expect(results.query).toBe(200);
  });

  it('reuses a signer across concurrent requests', () => {
    // Assess
    expect(results.reuseAllOk).toBe(true);
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) await testStack.destroy();
  });
});
