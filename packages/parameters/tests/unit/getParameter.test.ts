/**
 * Test getParameter function
 *
 * @group unit/parameters/ssm/getParameter/function
 */
import { DEFAULT_PROVIDERS } from '../../src/BaseProvider';
import { SSMProvider, getParameter } from '../../src/ssm';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

describe('Function: getParameter', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider doesn\'t exist, it instantiates one and returns the value', async () => {

    // Prepare
    const parameterName = 'foo';
    const parameterValue = 'foo';
    const client = mockClient(SSMClient).on(GetParameterCommand).resolves({
      Parameter: {
        Value: parameterValue,
      },
    });

    // Act
    const value = await getParameter(parameterName);

    // Assess
    expect(client).toReceiveCommandWith(GetParameterCommand, {
      Name: parameterName,
    });
    expect(value).toBe(parameterValue);

  });
  
  test('when called and a default provider exists, it uses it and returns the value', async () => {

    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const parameterName = 'foo';
    const parameterValue = 'foo';
    const client = mockClient(SSMClient).on(GetParameterCommand).resolves({
      Parameter: {
        Value: parameterValue,
      },
    });

    // Act
    const value = await getParameter(parameterName);

    // Assess
    expect(client).toReceiveCommandWith(GetParameterCommand, {
      Name: parameterName,
    });
    expect(value).toBe(parameterValue);
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);

  });

});