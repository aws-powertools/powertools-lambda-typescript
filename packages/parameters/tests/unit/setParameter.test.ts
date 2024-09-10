/**
 * Test setParameter function
 *
 * @group unit/parameters/ssm/setParameter/function
 */
import { PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { DEFAULT_PROVIDERS } from '../../src/base';
import { setParameter } from '../../src/ssm/index.js';
import { SSMProvider } from '../../src/ssm/SSMProvider';
import 'aws-sdk-client-mock-jest';
import type { SSMSetOptions } from '../../src/types/SSMProvider';

describe('Function: setParameter', () => {
  const parameterName = '/my-parameter';
  const client = mockClient(SSMClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    client.reset();
  });

  test('when called and a default provider does not exist, it instantiates one and sets the parameter', async () => {
    // Prepare
    const options: SSMSetOptions = { value: 'my-value' };
    client.on(PutParameterCommand).resolves({ Version: 1 });

    // Act
    const version = await setParameter(parameterName, options);

    // Assess
    expect(client).toReceiveCommandWith(PutParameterCommand, {
      Name: parameterName,
      Value: options.value,
    });
    expect(version).toBe(1);
  });

  test('when called and a default provider exists, it uses it and sets the parameter', async () => {
    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const options: SSMSetOptions = { value: 'my-value' };
    client.on(PutParameterCommand).resolves({ Version: 1 });

    // Act
    const version = await setParameter(parameterName, options);

    // Assess
    expect(client).toReceiveCommandWith(PutParameterCommand, {
      Name: parameterName,
      Value: options.value,
    });
    expect(version).toBe(1);
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);
  });

  test('when called and the sdk client throws an error a custom error should be thrown from the function', async () => {
    // Prepare
    const options: SSMSetOptions = { value: 'my-value' };
    client.on(PutParameterCommand).rejects(new Error('Could not send command'));

    // Assess
    expect(async () => {
      await setParameter(parameterName, options);
    }).rejects.toThrowError(
      `Unable to set parameter with name ${parameterName}`
    );
  });

  test('when called with additional sdk options, it sets the parameter with the sdk options successfully', async () => {
    // Prepare
    const options: SSMSetOptions = {
      value: 'my-value',
      sdkOptions: { Overwrite: true },
    };
    client.on(PutParameterCommand).resolves({ Version: 1 });

    // Act
    const version = await setParameter(parameterName, options);

    // Assess
    expect(client).toReceiveCommandWith(PutParameterCommand, {
      Name: parameterName,
      Value: options.value,
      Overwrite: true,
    });
    expect(version).toBe(1);
  });

  test.each([
    ['overwrite', true, 'Overwrite'],
    ['description', 'my-description', 'Description'],
    ['parameterType', 'SecureString', 'Type'],
    ['tier', 'Advanced', 'Tier'],
    ['kmsKeyId', 'my-key-id', 'KeyId'],
  ])(
    'when called with %s option, it sets the parameter with the option successfully',
    async (option, value, sdkOption) => {
      //Prepare
      const options: SSMSetOptions = { value: 'my-value', [option]: value };
      client.on(PutParameterCommand).resolves({ Version: 1 });

      // Act
      const version = await setParameter(parameterName, options);

      // Assess
      expect(client).toReceiveCommandWith(PutParameterCommand, {
        Name: parameterName,
        Value: options.value,
        [sdkOption]: value,
      });
      expect(version).toBe(1);
    }
  );
});
