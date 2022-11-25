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

    test('when called without sdkOptions, it gets the parameter using the name only', () => {

      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParameterCommand).resolves({});
      const parameterName = 'foo';

      // Act
      provider.get(parameterName);

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName
      });

    });
    
    test('when called with sdkOptions, it gets the parameter using the parameters', () => {

      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParameterCommand).resolves({});
      const parameterName = 'foo';

      // Act
      provider.get(parameterName, { sdkOptions: { } });

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName,
        
      });

    });

  });

});