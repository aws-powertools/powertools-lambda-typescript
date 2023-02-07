/**
 * Test SecretsPorovider class
 *
 * @group e2e/parameters/secrets/class
 */
import {
  createStackWithLambdaFunction,
  generateUniqueName,
  invokeFunction,
  isValidRuntimeKey
} from '../../../commons/tests/utils/e2eUtils';
import { RESOURCE_NAME_PREFIX, SETUP_TIMEOUT, TEARDOWN_TIMEOUT, TEST_CASE_TIMEOUT } from './constants';
import { v4 } from 'uuid';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { deployStack, destroyStack } from '../../../commons/tests/utils/cdk-cli';
import { App, Aspects, SecretValue, Stack } from 'aws-cdk-lib';
import path from 'path';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { InvocationLogs } from '../../../commons/tests/utils/InvocationLogs';
import { ResourceAccessGranter } from '../helpers/cdkAspectGrantAccess';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key: ${runtime}`);
}

const uuid = v4();
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'secretsProvider');
const functionName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'secretsProvider');
const lambdaFunctionCodeFile = 'secretsProvider.class.test.functionCode.ts';

const secretNamePlain = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'testSecretPlain');
const secretNamePlainCached = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'testSecretPlainCached');
const secretNameObject = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'testSecretObject');
const secretNameBinary = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'testSecretBinary');
const secretNameObjectWithSuffix = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'testSecretObject.json');
const secretNameBinaryWithSuffix = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'testSecretObject.binary');

const invocationCount = 1;

const integTestApp = new App();
let stack: Stack;

describe(`parameters E2E tests (SecretsProvider) for runtime: ${runtime}`, () => {

  let invocationLogs: InvocationLogs[];

  beforeAll(async () => {
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
        SECRET_NAME_OBJECT_WITH_SUFFIX: secretNameObjectWithSuffix,
        SECRET_NAME_BINARY_WITH_SUFFIX: secretNameBinaryWithSuffix,
        SECRET_NAME_PLAIN_CACHED: secretNamePlainCached,
      },
      runtime: runtime
    });

    const secretString = new Secret(stack, 'testSecretPlain', {
      secretName: secretNamePlain,
      secretStringValue: SecretValue.unsafePlainText('foo')
    });

    const secretObject = new Secret(stack, 'testSecretObject', {
      secretName: secretNameObject,
      secretObjectValue: {
        foo: SecretValue.unsafePlainText('bar'),
      }
    });

    const secretBinary = new Secret(stack, 'testSecretBinary', {
      secretName: secretNameBinary,
      secretStringValue: SecretValue.unsafePlainText('Zm9v') // 'foo' encoded in base64
    });

    const secretObjectWithSuffix = new Secret(stack, 'testSecretObjectWithSuffix', {
      secretName: secretNameObjectWithSuffix,
      secretObjectValue: {
        foo: SecretValue.unsafePlainText('bar')
      }
    });

    const secretBinaryWithSuffix = new Secret(stack, 'testSecretBinaryWithSuffix', {
      secretName: secretNameBinaryWithSuffix,
      secretStringValue: SecretValue.unsafePlainText('Zm9v') // 'foo' encoded in base64
    });

    const secretStringCached = new Secret(stack, 'testSecretStringCached', {
      secretName: secretNamePlainCached,
      secretStringValue: SecretValue.unsafePlainText('foo')
    });

    Aspects.of(stack).add(new ResourceAccessGranter([ secretString, secretObject, secretBinary, secretObjectWithSuffix, secretBinaryWithSuffix, secretStringCached ]));

    await deployStack(integTestApp, stack);

    invocationLogs = await invokeFunction(functionName, invocationCount, 'SEQUENTIAL');

  }, SETUP_TIMEOUT);

  describe('SecretsProvider usage', () => {
    it('should retrieve a single parameter', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[0]);

      expect(testLog).toStrictEqual({
        test: 'get-plain',
        value: 'foo'
      });
    }, TEST_CASE_TIMEOUT);

    it('should retrieve a single parameter with transform json', async () => {
      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[1]);

      expect(testLog).toStrictEqual({
        test: 'get-transform-json',
        value: { foo: 'bar' }
      });
    }, TEST_CASE_TIMEOUT);

    it('should retrieve single param with transform binary', async () => {
      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[2]);

      expect(testLog).toStrictEqual({
        test: 'get-transform-binary',
        value: 'foo'
      });
    }, TEST_CASE_TIMEOUT);
  });

  it('should retrieve single param with transform auto json', async () => {
    const logs = invocationLogs[0].getFunctionLogs();
    const testLog = InvocationLogs.parseFunctionLog(logs[3]);

    expect(testLog).toStrictEqual({
      test: 'get-transform-auto-json',
      value: { foo: 'bar' }
    });
  }, TEST_CASE_TIMEOUT);

  it('should retrieve single param wit transform auto binary', async () => {
    const logs = invocationLogs[0].getFunctionLogs();
    const testLog = InvocationLogs.parseFunctionLog(logs[4]);

    expect(testLog).toStrictEqual({
      test: 'get-transform-auto-binary',
      value: 'foo'
    });
  });

  it('should retrieve single parameter cached', async () => {
    const logs = invocationLogs[0].getFunctionLogs();
    const testLogFirst = InvocationLogs.parseFunctionLog(logs[5]);

    expect(testLogFirst).toStrictEqual({
      test: 'get-plain-cached',
      value: 1
    });
  });

  it('should retrieve single parameter twice without caching', async () => {
    const logs = invocationLogs[0].getFunctionLogs();
    const testLogFirst = InvocationLogs.parseFunctionLog(logs[6]);

    expect(testLogFirst).toStrictEqual({
      test: 'get-plain-force',
      value: 1
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);
});