/**
 * Test SecretsPorovider class
 *
 * @group e2e/parameters/secrets/class
 */
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  invokeFunctionOnce,
  isValidRuntimeKey,
  TestInvocationLogs,
  TestNodejsFunction,
  TestStack,
  TEST_RUNTIMES,
} from '@aws-lambda-powertools/testing-utils';
import { Aspects, SecretValue } from 'aws-cdk-lib';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { join } from 'node:path';
import { ResourceAccessGranter } from '../helpers/cdkAspectGrantAccess';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

/**
 * Collection of e2e tests for SecretsProvider utility.
 *
 * Test 1: create a secret with plain text value, fetch it with no additional options
 * Test 2: create a secret with json value, fetch it using `transform: 'json'` option
 * Test 3: create a secret with base64 encoded value (technicaly string), fetch it using `transform: 'binary'` option
 * Test 4: create a secret with plain text value, fetch it twice, check that value was cached, the number of SDK calls should be 1
 * Test 5: create a secret with plain text value, fetch it twice, second time with `forceFetch: true` option, check that value was not cached, the number of SDK calls should be 2
 *
 * For tests 4 and 5 we use our own AWS SDK custom middleware plugin `sdkMiddlewareRequestCounter.ts`
 *
 * Adding new test:
 * Please keep the state clean, and create dedicated resource for your test, don't reuse resources from other tests.
 * Pass the necessary information to lambda function by using enviroment variables
 * Make sure to add the right permissions to the lambda function to access the resources. We use our `ResourceAccessGranter` to add permissions.
 *
 */
describe(`Parameters E2E tests, Secrets Manager provider`, () => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key: ${runtime}`);
  }

  const testName = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'SecretsProvider',
  });
  const testStack = new TestStack(testName);

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'secretsProvider.class.test.functionCode.ts'
  );

  const functionName = concatenateResourceName({
    testName,
    resourceName: 'secretsProvider',
  });

  let invocationLogs: TestInvocationLogs;

  beforeAll(async () => {
    // use unique names for each test to keep a clean state
    const secretNamePlain = concatenateResourceName({
      testName,
      resourceName: 'testSecretPlain',
    });

    const secretNameObject = concatenateResourceName({
      testName,
      resourceName: 'testSecretObject',
    });

    const secretNameBinary = concatenateResourceName({
      testName,
      resourceName: 'testSecretBinary',
    });

    const secretNamePlainCached = concatenateResourceName({
      testName,
      resourceName: 'testSecretPlainCached',
    });

    const secretNamePlainForceFetch = concatenateResourceName({
      testName,
      resourceName: 'testSecretPlainForceFetch',
    });

    new TestNodejsFunction(testStack.stack, functionName, {
      functionName: functionName,
      entry: lambdaFunctionCodeFile,
      runtime: TEST_RUNTIMES[runtime],
      environment: {
        SECRET_NAME_PLAIN: secretNamePlain,
        SECRET_NAME_OBJECT: secretNameObject,
        SECRET_NAME_BINARY: secretNameBinary,
        SECRET_NAME_PLAIN_CACHED: secretNamePlainCached,
        SECRET_NAME_PLAIN_FORCE_FETCH: secretNamePlainForceFetch,
      },
    });

    const secretString = new Secret(testStack.stack, 'testSecretPlain', {
      secretName: secretNamePlain,
      secretStringValue: SecretValue.unsafePlainText('foo'),
    });

    const secretObject = new Secret(testStack.stack, 'testSecretObject', {
      secretName: secretNameObject,
      secretObjectValue: {
        foo: SecretValue.unsafePlainText('bar'),
      },
    });

    const secretBinary = new Secret(testStack.stack, 'testSecretBinary', {
      secretName: secretNameBinary,
      secretStringValue: SecretValue.unsafePlainText('Zm9v'), // 'foo' encoded in base64
    });

    const secretStringCached = new Secret(
      testStack.stack,
      'testSecretStringCached',
      {
        secretName: secretNamePlainCached,
        secretStringValue: SecretValue.unsafePlainText('foo'),
      }
    );

    const secretStringForceFetch = new Secret(
      testStack.stack,
      'testSecretStringForceFetch',
      {
        secretName: secretNamePlainForceFetch,
        secretStringValue: SecretValue.unsafePlainText('foo'),
      }
    );

    // add secrets here to grant lambda permisisons to access secrets
    Aspects.of(testStack.stack).add(
      new ResourceAccessGranter([
        secretString,
        secretObject,
        secretBinary,
        secretStringCached,
        secretStringForceFetch,
      ])
    );

    await testStack.deploy();

    invocationLogs = await invokeFunctionOnce({
      functionName,
    });
  }, SETUP_TIMEOUT);

  describe('SecretsProvider usage', () => {
    it(
      'should retrieve a secret as plain string',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[0]);

        expect(testLog).toStrictEqual({
          test: 'get-plain',
          value: 'foo',
        });
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should retrieve a secret using transform json option',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[1]);

        expect(testLog).toStrictEqual({
          test: 'get-transform-json',
          value: { foo: 'bar' },
        });
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should retrieve a secret using transform binary option',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[2]);

        expect(testLog).toStrictEqual({
          test: 'get-transform-binary',
          value: 'foo',
        });
      },
      TEST_CASE_TIMEOUT
    );
  });

  it('should retrieve a secret twice with cached value', async () => {
    const logs = invocationLogs.getFunctionLogs();
    const testLogFirst = TestInvocationLogs.parseFunctionLog(logs[3]);

    // we fetch twice, but we expect to make an API call only once
    expect(testLogFirst).toStrictEqual({
      test: 'get-plain-cached',
      value: 1,
    });
  });

  it('should retrieve a secret twice with forceFetch second time', async () => {
    const logs = invocationLogs.getFunctionLogs();
    const testLogFirst = TestInvocationLogs.parseFunctionLog(logs[4]);

    // we fetch twice, 2nd time with forceFetch: true flag, we expect two api calls
    expect(testLogFirst).toStrictEqual({
      test: 'get-plain-force',
      value: 2,
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});
