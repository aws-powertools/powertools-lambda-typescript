import { randomUUID } from 'node:crypto';
import { InvokeStore } from '@aws/lambda-invoke-store';
import {
  defaultArchitecture,
  defaultRuntime,
  TEST_ARCHITECTURES,
  TEST_RUNTIMES,
} from './constants.js';

const isValidRuntimeKey = (
  runtime: string
): runtime is keyof typeof TEST_RUNTIMES =>
  runtime in TEST_RUNTIMES || runtime === 'nodejs22x';

const getRuntimeKey = (): keyof typeof TEST_RUNTIMES => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  return runtime;
};

const isValidArchitectureKey = (
  architecture: string
): architecture is keyof typeof TEST_ARCHITECTURES =>
  architecture in TEST_ARCHITECTURES;

const getArchitectureKey = (): keyof typeof TEST_ARCHITECTURES => {
  const architecture: string = process.env.ARCH || defaultArchitecture;

  if (!isValidArchitectureKey(architecture)) {
    throw new Error(`Invalid architecture key value: ${architecture}`);
  }

  return architecture;
};

/**
 * Generate a unique name for a test.
 *
 * The maximum length of the name is 45 characters.
 *
 * @example
 * ```ts
 * process.env.RUNTIME = 'nodejs18x';
 * process.env.ARCH = 'x86_64';
 * const testPrefix = 'TRACER';
 * const testName = 'someFeature';
 * const uniqueName = generateTestUniqueName({ testPrefix, testName });
 * // uniqueName = 'TRACER-18-x86-12345-someFeature'
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
    getRuntimeKey().replace(/[nodejsx]/g, ''),
    getArchitectureKey().replace(/_64/g, ''),
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

type Invocation = {
  sideEffects: (() => void)[];
  return: () => unknown;
};

/**
 * Creates a Promise with externally accessible resolve and reject functions.
 *
 * This is a polyfill for the proposed Promise.withResolvers() method that provides
 * a more convenient way to create promises that can be resolved or rejected from
 * outside the Promise constructor.
 *
 * We need this polyfill because this function is not available in Node 20. When we drop
 * support for this version of Node, then we should remove this function and use the
 * inbuilt `Promise.withResolvers` static methods.
 *
 * @returns Object containing the promise and its resolve/reject functions
 *
 * @example
 * ```typescript
 * const { promise, resolve, reject } = withResolvers<string>();
 *
 * // Later, from somewhere else:
 * resolve('success');
 *
 * // Or:
 * reject(new Error('failed'));
 * ```
 */
const withResolvers = <T>() => {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/**
 * Executes two invocations concurrently with synchronized side effects to test isolation behavior.
 *
 * This function ensures that side effects are executed in a specific order across both
 * invocations using barrier synchronization. Each step waits for the corresponding step
 * in the other invocation to complete before proceeding to the next step.
 *
 * @param inv1 - First invocation configuration
 * @param inv1.sideEffects - Array of functions to execute sequentially, synchronized with inv2
 * @param inv1.return - Function to call after all side effects, returns the test result
 * @param inv2 - Second invocation configuration
 * @param inv2.sideEffects - Array of functions to execute sequentially, synchronized with inv1
 * @param inv2.return - Function to call after all side effects, returns the test result
 * @param options - Execution options
 * @param options.useInvokeStore - Whether to run invocations in separate InvokeStore contexts
 *   - `true`: Each invocation runs in its own InvokeStore.run() context (isolated)
 *   - `false`: Both invocations run in shared context (no isolation)
 *
 * @returns Promise that resolves to tuple of [inv1Result, inv2Result]
 *
 * @example
 * ```typescript
 * // Basic 2-step sequencing: inv1 acts, then inv2 acts
 * const [result1, result2] = await sequence({
 *   sideEffects: [() => doSomething('A')],
 *   return: () => getResult()
 * }, {
 *   sideEffects: [() => doSomething('B')],
 *   return: () => getResult()
 * }, { useInvokeStore: true });
 *
 * // Execution order: inv1 doSomething('A') → inv2 doSomething('B') → both return
 * ```
 *
 * @example
 * ```typescript
 * // Complex 3-step sequencing with barriers
 * const [result1, result2] = await sequence({
 *   sideEffects: [
 *     () => action1(),     // Step 1: inv1 acts first
 *     () => {},            // Step 2: inv1 waits for inv2
 *     () => action3()      // Step 3: inv1 acts after inv2
 *   ],
 *   return: () => getResult()
 * }, {
 *   sideEffects: [
 *     () => {},            // Step 1: inv2 waits for inv1
 *     () => action2(),     // Step 2: inv2 acts after inv1
 *     () => {}             // Step 3: inv2 waits for inv1
 *   ],
 *   return: () => getResult()
 * }, { useInvokeStore: false });
 *
 * // Execution order: action1() → action2() → action3() → both return
 * ```
 */
function sequence(
  inv1: Invocation,
  inv2: Invocation,
  options: { useInvokeStore?: boolean }
) {
  const executionEnv = options?.useInvokeStore
    ? (f: () => unknown) => InvokeStore.run({}, f)
    : (f: () => unknown) => f();

  const inv1Barriers = inv1.sideEffects.map(() => withResolvers<void>());
  const inv2Barriers = inv2.sideEffects.map(() => withResolvers<void>());

  const invocation1 = executionEnv(async () => {
    for (let i = 0; i < inv1Barriers.length; i++) {
      const sideEffect = inv1.sideEffects[i] ?? (() => {});
      sideEffect();
      inv1Barriers[i].resolve();
      await inv2Barriers[i].promise;
    }
    return inv1.return();
  });

  const invocation2 = executionEnv(async () => {
    for (let i = 0; i < inv2Barriers.length; i++) {
      await inv1Barriers[i].promise;
      const sideEffect = inv2.sideEffects[i] ?? (() => {});
      sideEffect();
      inv2Barriers[i].resolve();
    }
    return inv2.return();
  });

  return Promise.all([invocation1, invocation2]);
}

export {
  isValidRuntimeKey,
  getRuntimeKey,
  generateTestUniqueName,
  concatenateResourceName,
  findAndGetStackOutputValue,
  getArchitectureKey,
  withResolvers,
  sequence,
};
export type { Invocation };
