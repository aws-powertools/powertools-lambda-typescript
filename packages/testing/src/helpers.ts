import { randomUUID } from 'node:crypto';
import { TEST_RUNTIMES } from './constants';

const isValidRuntimeKey = (
  runtime: string
): runtime is keyof typeof TEST_RUNTIMES => runtime in TEST_RUNTIMES;

/**
 * Generate a unique name for a test.
 *
 * The maximum length of the name is 45 characters.
 *
 * @example
 * ```ts
 * const testPrefix = 'E2E-TRACER';
 * const runtime = 'nodejs18x';
 * const testName = 'someFeature';
 * const uniqueName = generateTestUniqueName({ testPrefix, runtime, testName });
 * // uniqueName = 'E2E-TRACER-node18-12345-someFeature'
 * ```
 */
const generateTestUniqueName = ({
  testPrefix,
  runtime,
  testName,
}: {
  testPrefix: string;
  runtime: string;
  testName: string;
}): string =>
  [
    testPrefix,
    runtime.replace(/[jsx]/g, ''),
    randomUUID().toString().substring(0, 5),
    testName,
  ]
    .join('-')
    .substring(0, 45);

/**
 * Given a test name and a resource name, generate a unique name for the resource.
 *
 * The maximum length of the name is 64 characters.
 */
const concatenateResourceName = ({
  testName,
  resourceName,
}: {
  testName: string;
  resourceName: string;
}): string => `${testName}-${resourceName}`.substring(0, 64);

export { isValidRuntimeKey, generateTestUniqueName, concatenateResourceName };
