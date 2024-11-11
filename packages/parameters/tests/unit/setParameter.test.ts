import { PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PROVIDERS } from '../../src/base/index.js';
import { SSMProvider } from '../../src/ssm/SSMProvider.js';
import { setParameter } from '../../src/ssm/index.js';
import type { SSMSetOptions } from '../../src/types/SSMProvider.js';

describe('Function: setParameter', () => {
  const parameterName = '/my-parameter';
  const client = mockClient(SSMClient);

  beforeEach(() => {
    client.reset();
  });

  it('instantiates a new client when called and a default provider does not exist', async () => {
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

  it('uses the existing provider when called and a default one exists in the cache', async () => {
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

  it('rethrows the error thrown by the underlying sdk client', async () => {
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

  it('uses the provided sdkOptions when provided', async () => {
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

  it.each([
    ['overwrite', true, 'Overwrite'],
    ['description', 'my-description', 'Description'],
    ['parameterType', 'SecureString', 'Type'],
    ['tier', 'Advanced', 'Tier'],
    ['kmsKeyId', 'my-key-id', 'KeyId'],
  ])(
    'sets the parameter with the option when called with %s option',
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
