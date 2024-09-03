/**
 * Test setParameter function
 *
 * @group unit/parameters/ssm/setParameter/function
 */
import { PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { DEFAULT_PROVIDERS } from '../../src/base';
import { SSMProvider } from '../../src/ssm/SSMProvider';
import { setParameter } from '../../src/ssm/setParameter';
import 'aws-sdk-client-mock-jest';
import type { SSMSetOptions } from '../../src/types/SSMProvider';

describe('Function: setParameter', () => {
  const parameterName = '/my-parameter';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider does not exist, it instantiates one and sets the parameter', async () => {
    const options: SSMSetOptions = { value: 'my-value' };
    const client = mockClient(SSMClient)
      .on(PutParameterCommand)
      .resolves({ Version: 1 });

    const version = await setParameter(parameterName, options);

    expect(client).toReceiveCommandWith(PutParameterCommand, {
      Name: parameterName,
      Value: options.value,
    });
    expect(version).toBe(1);
  });

  test('when called and a default provider exists, it uses it and sets the parameter', async () => {
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const options: SSMSetOptions = { value: 'my-value' };
    const client = mockClient(SSMClient)
      .on(PutParameterCommand)
      .resolves({ Version: 1 });

    const version = await setParameter(parameterName, options);

    expect(client).toReceiveCommandWith(PutParameterCommand, {
      Name: parameterName,
      Value: options.value,
    });
    expect(version).toBe(1);
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);
  });

  test('when called and setting a parameter returns an undefined version, it returns undefined', async () => {
    const options: SSMSetOptions = { value: 'my-value' };
    const client = mockClient(SSMClient).on(PutParameterCommand).resolves({});

    const version = await setParameter(parameterName, options);

    expect(client).toReceiveCommandWith(PutParameterCommand, {
      Name: parameterName,
      Value: options.value,
    });
    expect(version).toBeUndefined();
  });

  test('when called with additional sdk options, it sets the parameter with the sdk options successfully', async () => {
    const options: SSMSetOptions = {
      value: 'my-value',
      sdkOptions: { Overwrite: true },
    };
    const client = mockClient(SSMClient)
      .on(PutParameterCommand)
      .resolves({ Version: 1 });

    const version = await setParameter(parameterName, options);

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
      const options: SSMSetOptions = { value: 'my-value', [option]: value };
      const client = mockClient(SSMClient)
        .on(PutParameterCommand)
        .resolves({ Version: 1 });

      const version = await setParameter(parameterName, options);

      expect(client).toReceiveCommandWith(PutParameterCommand, {
        Name: parameterName,
        Value: options.value,
        [sdkOption]: value,
      });
      expect(version).toBe(1);
    }
  );
});
