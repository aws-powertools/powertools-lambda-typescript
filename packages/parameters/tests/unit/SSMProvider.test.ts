/**
  * Test SSMProvider class
 *
 * @group unit/parameters/SSMProvider/class
 */
import { SSMProvider } from '../../src/SSMProvider';
import { SSMClient, GetParameterCommand, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
 
describe('Class: SSMProvider', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Method: _get', () => {

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
      await provider.get(parameterName, { sdkOptions: { WithDecryption: true } });

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName,
        WithDecryption: true,
      });

    });

    test('when called with the decrypt option, the WithDecryption parameter is passed to the sdk client', async () => {

      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParameterCommand).resolves({});
      const parameterName = 'foo';

      // Act
      await provider.get(parameterName, { decrypt: true });

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName,
        WithDecryption: true,
      });

    });

  });

  describe('Method: _getMultiple', () => {

    test('when called with only a path, it passes it to the sdk', async () => {

      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParametersByPathCommand)
        .resolves({});
      const parameterPath = '/foo';

      // Act
      await provider.getMultiple(parameterPath);
      
      // Assess
      expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
        Path: parameterPath,
      });

    });

    test('when called with a path and sdkOptions, it passes them to the sdk', async () => {

      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParametersByPathCommand)
        .resolves({
          Parameters: []
        });
      const parameterPath = '/foo';

      // Act
      await provider.getMultiple(parameterPath, { sdkOptions: { MaxResults: 10 } });
      
      // Assess
      expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
        Path: parameterPath,
        MaxResults: 10,
      });

    });

    test('when called with no options, it uses the default sdk options', async () => {

      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParametersByPathCommand)
        .resolves({
          Parameters: []
        });
      const parameterPath = '/foo';

      // Act
      await provider.getMultiple(parameterPath);
      
      // Assess
      expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
        Path: parameterPath,
      });

    });
    
    test('when called with decrypt or recursive, it passes them to the sdk', async () => {

      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParametersByPathCommand)
        .resolves({
          Parameters: []
        });
      const parameterPath = '/foo';

      // Act
      await provider.getMultiple(parameterPath, { recursive: false, decrypt: true });
      
      // Assess
      expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
        Path: parameterPath,
        Recursive: false,
        WithDecryption: true,
      });

    });
    
    test('when multiple parameters that share the same path as suffix are retrieved, it returns an object with the names only', async () => {

      // Prepare
      const provider = new SSMProvider();
      mockClient(SSMClient).on(GetParametersByPathCommand)
        .resolves({
          Parameters: [ {
            'Name':'/foo/bar',
            'Value':'bar',
          }, {
            'Name':'/foo/baz',
            'Value':'baz',
          } ]
        });
      const parameterPath = '/foo';

      // Act
      const parameters = await provider.getMultiple(parameterPath);
      
      // Assess
      expect(parameters).toEqual({
        'bar': 'bar',
        'baz': 'baz',
      });

    });

    test('when multiple pages are found, it returns an object with all the parameters', async () => {

      // Prepare
      const provider = new SSMProvider();
      mockClient(SSMClient).on(GetParametersByPathCommand)
        .resolvesOnce({
          Parameters: [{
            Name:'/foo/bar',
            Value:'bar',
          }],
          NextToken: 'someToken',
        })
        .resolves({
          Parameters: [{
            Name:'/foo/baz',
            Value:'baz',
          }]
        });
      const parameterPath = '/foo';

      // Act
      const parameters = await provider.getMultiple(parameterPath);
      
      // Assess
      expect(parameters).toEqual({
        'bar': 'bar',
        'baz': 'baz',
      });

    });

  });

});