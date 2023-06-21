/**
 * Test SecretsPorovider class
 *
 * @group e2e/parameters/secrets/class
 */
import {
  createStackWithLambdaFunction,
  generateUniqueName,
  invokeFunction,
  isValidRuntimeKey,
} from '../../../commons/tests/utils/e2eUtils';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';
import { v4 } from 'uuid';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  deployStack,
  destroyStack,
} from '../../../commons/tests/utils/cdk-cli';
import { App, Aspects, SecretValue, Stack } from 'aws-cdk-lib';
import path from 'path';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { InvocationLogs } from '../../../commons/tests/utils/InvocationLogs';
import { ResourceAccessGranter } from '../helpers/cdkAspectGrantAccess';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key: ${runtime}`);
}
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
describe(`parameters E2E tests (SecretsProvider) for runtime: ${runtime}`, () => {
  const uuid = v4();
  let invocationLogs: InvocationLogs[];
  const stackName = generateUniqueName(
    RESOURCE_NAME_PREFIX,
    uuid,
    runtime,
    'secretsProvider'
  );
  const functionName = generateUniqueName(
    RESOURCE_NAME_PREFIX,
    uuid,
    runtime,
    'secretsProvider'
  );
  const lambdaFunctionCodeFile = 'secretsProvider.class.test.functionCode.ts';

  const invocationCount = 1;

  const integTestApp = new App();
  let stack: Stack;

  beforeAll(async () => {
    // use unique names for each test to keep a clean state
    const secretNamePlain = generateUniqueName(
      RESOURCE_NAME_PREFIX,
      uuid,
      runtime,
      'testSecretPlain'
    );
    const secretNameObject = generateUniqueName(
      RESOURCE_NAME_PREFIX,
      uuid,
      runtime,
      'testSecretObject'
    );
    const secretNameBinary = generateUniqueName(
      RESOURCE_NAME_PREFIX,
      uuid,
      runtime,
      'testSecretBinary'
    );
    const secretNamePlainCached = generateUniqueName(
      RESOURCE_NAME_PREFIX,
      uuid,
      runtime,
      'testSecretPlainCached'
    );
    const secretNamePlainForceFetch = generateUniqueName(
      RESOURCE_NAME_PREFIX,
      uuid,
      runtime,
      'testSecretPlainForceFetch'
    );

    // creates the test fuction that uses Powertools for AWS Lambda (TypeScript) secret provider we want to test
    // pass env vars with secret names we want to fetch
    stack = createStackWithLambdaFunction({
      app: integTestApp,
      stackName: stackName,
      functionName: functionName,
      functionEntry: path.join(__dirname, lambdaFunctionCodeFile),
      tracing: Tracing.ACTIVE,
      environment: {
        UUID: uuid,
        SECRET_NAME_PLAIN: secretNamePlain,
        SECRET_NAME_OBJECT: secretNameObject,
        SECRET_NAME_BINARY: secretNameBinary,
        SECRET_NAME_PLAIN_CACHED: secretNamePlainCached,
        SECRET_NAME_PLAIN_FORCE_FETCH: secretNamePlainForceFetch,
      },
      runtime: runtime,
    });

    const secretString = new Secret(stack, 'testSecretPlain', {
      secretName: secretNamePlain,
      secretStringValue: SecretValue.unsafePlainText('foo'),
    });

    const secretObject = new Secret(stack, 'testSecretObject', {
      secretName: secretNameObject,
      secretObjectValue: {
        foo: SecretValue.unsafePlainText('bar'),
      },
    });

    const secretBinary = new Secret(stack, 'testSecretBinary', {
      secretName: secretNameBinary,
      secretStringValue: SecretValue.unsafePlainText('Zm9v'), // 'foo' encoded in base64
    });

    const secretStringCached = new Secret(stack, 'testSecretStringCached', {
      secretName: secretNamePlainCached,
      secretStringValue: SecretValue.unsafePlainText('foo'),
    });

    const secretStringForceFetch = new Secret(
      stack,
      'testSecretStringForceFetch',
      {
        secretName: secretNamePlainForceFetch,
        secretStringValue: SecretValue.unsafePlainText('foo'),
      }
    );

    // add secrets here to grant lambda permisisons to access secrets
    Aspects.of(stack).add(
      new ResourceAccessGranter([
        secretString,
        secretObject,
        secretBinary,
        secretStringCached,
        secretStringForceFetch,
      ])
    );

    await deployStack(integTestApp, stack);

    invocationLogs = await invokeFunction(
      functionName,
      invocationCount,
      'SEQUENTIAL'
    );
  }, SETUP_TIMEOUT);

  describe('SecretsProvider usage', () => {
    it(
      'should retrieve a secret as plain string',
      async () => {
        const logs = invocationLogs[0].getFunctionLogs();
        const testLog = InvocationLogs.parseFunctionLog(logs[0]);

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
        const logs = invocationLogs[0].getFunctionLogs();
        const testLog = InvocationLogs.parseFunctionLog(logs[1]);

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
        const logs = invocationLogs[0].getFunctionLogs();
        const testLog = InvocationLogs.parseFunctionLog(logs[2]);

        expect(testLog).toStrictEqual({
          test: 'get-transform-binary',
          value: 'foo',
        });
      },
      TEST_CASE_TIMEOUT
    );
  });

  it('should retrieve a secret twice with cached value', async () => {
    const logs = invocationLogs[0].getFunctionLogs();
    const testLogFirst = InvocationLogs.parseFunctionLog(logs[3]);

    // we fetch twice, but we expect to make an API call only once
    expect(testLogFirst).toStrictEqual({
      test: 'get-plain-cached',
      value: 1,
    });
  });

  it('should retrieve a secret twice with forceFetch second time', async () => {
    const logs = invocationLogs[0].getFunctionLogs();
    const testLogFirst = InvocationLogs.parseFunctionLog(logs[4]);

    // we fetch twice, 2nd time with forceFetch: true flag, we expect two api calls
    expect(testLogFirst).toStrictEqual({
      test: 'get-plain-force',
      value: 2,
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);
});
