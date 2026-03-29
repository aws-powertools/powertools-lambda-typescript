import { join } from 'node:path';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { fromUtf8, toUtf8 } from '@smithy/util-utf8';
import { Key } from 'aws-cdk-lib/aws-kms';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RESOURCE_NAME_PREFIX } from './constants.js';

const lambda = new LambdaClient({});

const invoke = async (
  functionName: string,
  payload: Record<string, unknown>
): Promise<unknown> => {
  const result = await lambda.send(
    new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: fromUtf8(JSON.stringify(payload)),
    })
  );

  return JSON.parse(toUtf8(result.Payload ?? new Uint8Array()));
};

describe('DataMasking E2E tests', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'dataMasking',
    },
  });

  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'dataMasking.test.FunctionCode.ts'
  );

  const kmsKey = new Key(testStack.stack, 'TestKmsKey', {
    description: 'KMS key for DataMasking e2e tests',
  });

  let functionNameErase: string;
  new TestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      handler: 'handlerErase',
    },
    { nameSuffix: 'erase' }
  );

  let functionNameFieldEncrypt: string;
  const fieldEncryptFn = new TestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      handler: 'handlerFieldEncrypt',
      environment: {
        KMS_KEY_ARN: kmsKey.keyArn,
      },
    },
    { nameSuffix: 'fieldEncrypt' }
  );
  kmsKey.grantEncryptDecrypt(fieldEncryptFn);

  let functionNameFullEncrypt: string;
  const fullEncryptFn = new TestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      handler: 'handlerFullEncrypt',
      environment: {
        KMS_KEY_ARN: kmsKey.keyArn,
      },
    },
    { nameSuffix: 'fullEncrypt' }
  );
  kmsKey.grantEncryptDecrypt(fullEncryptFn);

  beforeAll(async () => {
    await testStack.deploy();
    functionNameErase = testStack.findAndGetStackOutputValue('erase');
    functionNameFieldEncrypt =
      testStack.findAndGetStackOutputValue('fieldEncrypt');
    functionNameFullEncrypt =
      testStack.findAndGetStackOutputValue('fullEncrypt');
  }, 300_000);

  afterAll(async () => {
    await testStack.destroy();
  }, 300_000);

  const testPayload = {
    orderId: '12345',
    customer: { name: 'Jane', ssn: '123-45-6789' },
    payment: { card: '4111-1111-1111-1111', amount: 99.99 },
  };

  it('erase masks specified fields', async () => {
    const result = await invoke(functionNameErase, testPayload);

    expect(result).toEqual({
      orderId: '12345',
      customer: { name: 'Jane', ssn: '*****' },
      payment: { card: '*****', amount: 99.99 },
    });
  });

  it('field-level encrypt/decrypt round-trips correctly', async () => {
    const result = await invoke(functionNameFieldEncrypt, testPayload);

    expect(result).toStrictEqual(testPayload);
  });

  it('full-payload encrypt/decrypt round-trips correctly', async () => {
    const result = await invoke(functionNameFullEncrypt, testPayload);

    expect(result).toStrictEqual(testPayload);
  });
});
