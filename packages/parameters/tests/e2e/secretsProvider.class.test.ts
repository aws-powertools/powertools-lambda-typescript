/**
 * Test SecretsPorovider class
 *
 * @group e2e/parameters/secrets/class
 */
import {
  invokeFunctionOnce,
  TestInvocationLogs,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { SecretValue } from 'aws-cdk-lib';
import { join } from 'node:path';
import { TestSecret } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants.js';

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
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'Secrets',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'secretsProvider.class.test.functionCode.ts'
  );

  let invocationLogs: TestInvocationLogs;

  beforeAll(async () => {
    const testFunction = new TestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
      },
      {
        nameSuffix: 'secretsProvider',
        outputFormat: 'ESM',
      }
    );

    const secretString = new TestSecret(
      testStack,
      {
        secretStringValue: SecretValue.unsafePlainText('foo'),
      },
      {
        nameSuffix: 'testSecretPlain',
      }
    );
    secretString.grantRead(testFunction);
    testFunction.addEnvironment('SECRET_NAME_PLAIN', secretString.secretName);

    const secretObject = new TestSecret(
      testStack,
      {
        secretObjectValue: {
          foo: SecretValue.unsafePlainText('bar'),
        },
      },
      {
        nameSuffix: 'testSecretObject',
      }
    );
    secretObject.grantRead(testFunction);
    testFunction.addEnvironment('SECRET_NAME_OBJECT', secretObject.secretName);

    const secretBinary = new TestSecret(
      testStack,
      {
        secretStringValue: SecretValue.unsafePlainText('Zm9v'), // 'foo' encoded in base64
      },
      {
        nameSuffix: 'testSecretBinary',
      }
    );
    secretBinary.grantRead(testFunction);
    testFunction.addEnvironment('SECRET_NAME_BINARY', secretBinary.secretName);

    const secretStringCached = new TestSecret(
      testStack,
      {
        secretStringValue: SecretValue.unsafePlainText('foo'),
      },
      {
        nameSuffix: 'testSecretPlainCached',
      }
    );
    secretStringCached.grantRead(testFunction);
    testFunction.addEnvironment(
      'SECRET_NAME_PLAIN_CACHED',
      secretStringCached.secretName
    );

    const secretStringForceFetch = new TestSecret(
      testStack,
      {
        secretStringValue: SecretValue.unsafePlainText('foo'),
      },
      {
        nameSuffix: 'testSecretPlainForceFetch',
      }
    );
    secretStringForceFetch.grantRead(testFunction);
    testFunction.addEnvironment(
      'SECRET_NAME_PLAIN_FORCE_FETCH',
      secretStringForceFetch.secretName
    );

    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    const functionName =
      testStack.findAndGetStackOutputValue('secretsProvider');

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
