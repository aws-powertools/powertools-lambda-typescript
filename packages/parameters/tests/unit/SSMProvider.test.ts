/**
  * Test SSMProvider class
 *
 * @group unit/idempotency/all
 */
import { SSMProvider } from '../../src/SSMProvider';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
 
describe('Class: SSMProvider', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Method: get', () => {

    test('when called without sdkOptions, it gets the parameter using the name and with no decryption', async () => {

      // Prepare
      const provider = new SSMProvider();
      const parameterName = 'foo';
      const parameterValue = 'foo';
      const client = mockClient(SSMClient).on(GetParameterCommand).resolves({
        Parameter: {
          Value: parameterValue,
        },
      });

      // Act
      const value = await provider.get(parameterName);

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName,
      });
      expect(value).toBe(parameterValue);

    });
    
    test('when called with sdkOptions, it gets the parameter using the parameters', async () => {

      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParameterCommand).resolves({});
      const parameterName = 'foo';

      // Act
      provider.get(parameterName, { sdkOptions: { WithDecryption: true } });

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName,
        WithDecryption: true,
      });

    });

  });

  describe('Method: _getMultiple', () => {

    test('when called throws', async () => {

      // Prepare
      const provider = new SSMProvider();

      // Act / Assess
      expect(provider.getMultiple('foo')).rejects.toThrow('Not implemented.');

    });

  });

});