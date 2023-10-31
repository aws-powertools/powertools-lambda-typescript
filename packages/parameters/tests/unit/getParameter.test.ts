/**
 * Test getParameter function
 *
 * @group unit/parameters/ssm/getParameter/function
 */
import { DEFAULT_PROVIDERS } from '../../src/base/index.js';
import { SSMProvider, getParameter } from '../../src/ssm/index.js';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

/**
 * Note that the following tests include type annotations on the results of each call. This is to ensure that the
 * generic types defined in the utility are working as expected. If they are not, the tests will fail to compile.
 */
describe('Function: getParameter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider does not exist, it instantiates one and returns the value', async () => {
    // Prepare
    const parameterName = 'foo';
    const parameterValue = 'foo';
    const client = mockClient(SSMClient)
      .on(GetParameterCommand)
      .resolves({
        Parameter: {
          Value: parameterValue,
        },
      });

    // Act
    const value: string | undefined = await getParameter(parameterName);

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
    const client = mockClient(SSMClient)
      .on(GetParameterCommand)
      .resolves({
        Parameter: {
          Value: parameterValue,
        },
      });

    // Act
    const value: string | undefined = await getParameter(parameterName);

    // Assess
    expect(client).toReceiveCommandWith(GetParameterCommand, {
      Name: parameterName,
    });
    expect(value).toBe(parameterValue);
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);
  });

  test('when called and transform `JSON` is specified, it returns an object with correct type', async () => {
    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const parameterName = 'foo';
    const parameterValue = JSON.stringify({ hello: 'world' });
    const client = mockClient(SSMClient)
      .on(GetParameterCommand)
      .resolves({
        Parameter: {
          Value: parameterValue,
        },
      });

    // Act
    const value: Record<string, unknown> | undefined = await getParameter(
      parameterName,
      { transform: 'json' }
    );

    // Assess
    expect(client).toReceiveCommandWith(GetParameterCommand, {
      Name: parameterName,
    });
    expect(value).toStrictEqual(JSON.parse(parameterValue));
  });

  test('when called and transform `JSON` is specified as well as an explicit `K` type, it returns a result with correct type', async () => {
    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const parameterName = 'foo';
    const parameterValue = JSON.stringify(5);
    const client = mockClient(SSMClient)
      .on(GetParameterCommand)
      .resolves({
        Parameter: {
          Value: parameterValue,
        },
      });

    // Act
    const value: number | undefined = await getParameter<number>(
      parameterName,
      { transform: 'json' }
    );

    // Assess
    expect(client).toReceiveCommandWith(GetParameterCommand, {
      Name: parameterName,
    });
    expect(value).toBe(JSON.parse(parameterValue));
  });
});
