import { randomUUID } from 'node:crypto';
import { TEST_RUNTIMES, defaultRuntime } from './constants';

const isValidRuntimeKey = (
  runtime: string
): runtime is keyof typeof TEST_RUNTIMES => runtime in TEST_RUNTIMES;

const getRuntimeKey = (): keyof typeof TEST_RUNTIMES => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  return runtime;
};

/**
 * Generate a unique name for a test.
 *
 * The maximum length of the name is 45 characters.
 *
 * @example
 * ```ts
 * process.env.RUNTIME = 'nodejs18x';
 * const testPrefix = 'E2E-TRACER';
 * const testName = 'someFeature';
 * const uniqueName = generateTestUniqueName({ testPrefix, testName });
 * // uniqueName = 'E2E-TRACER-node18-12345-someFeature'
 * ```
 */
const generateTestUniqueName = ({
  testPrefix,
  testName,
}: {
  testPrefix: string;
  testName: string;
}): string =>
  [
    testPrefix,
    getRuntimeKey().replace(/[jsx]/g, ''),
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

/**
 * Find and get the value of a StackOutput by its key.
 */
const findAndGetStackOutputValue = (
  outputs: Record<string, string>,
  key: string
): string => {
  const value = Object.keys(outputs).find((outputKey) =>
    outputKey.includes(key)
  );
  if (!value) {
    throw new Error(`Cannot find output for ${key}`);
  }

  return outputs[value];
};

export {
  isValidRuntimeKey,
  getRuntimeKey,
  generateTestUniqueName,
  concatenateResourceName,
  findAndGetStackOutputValue,
};
