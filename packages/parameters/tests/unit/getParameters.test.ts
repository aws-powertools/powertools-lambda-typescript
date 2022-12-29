/**
 * Test getParameters function
 *
 * @group unit/parameters/ssm/getParameters/function
 */
import { DEFAULT_PROVIDERS } from '../../src/BaseProvider';
import { SSMProvider, getParameters } from '../../src/ssm';
import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

describe('Function: getParameters', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider doesn\'t exist, it instantiates one and returns the value', async () => {

    // Prepare
    const parameterPath = '/foo';
    const parameterValue = 'bar';
    const client = mockClient(SSMClient).on(GetParametersByPathCommand).resolves({
      Parameters: [{
        Name: '/foo/bar',
        Value: parameterValue,
      }],
    });

    // Act
    const parameters = await getParameters(parameterPath);

    // Assess
    expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
      Path: parameterPath,
    });
    expect(parameters).toEqual({
      bar: parameterValue,
    });

  });
  
  test('when called and a default provider exists, it uses it and returns the value', async () => {

    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const parameterPath = '/foo';
    const parameterValue = 'bar';
    const client = mockClient(SSMClient).on(GetParametersByPathCommand).resolves({
      Parameters: [{
        Name: '/foo/bar',
        Value: parameterValue,
      }],
    });

    // Act
    const parameters = await getParameters(parameterPath);

    // Assess
    expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
      Path: parameterPath,
    });
    expect(parameters).toEqual({
      'bar': parameterValue,
    });
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);

  });

});