/**
 * Test getParameters function
 *
 * @group unit/parameters/ssm/getParameters/function
 */
import { DEFAULT_PROVIDERS } from '../../src/base/index.js';
import { SSMProvider, getParameters } from '../../src/ssm/index.js';
import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

/**
 * Note that the following tests include type annotations on the results of each call. This is to ensure that the
 * generic types defined in the utility are working as expected. If they are not, the tests will fail to compile.
 */
describe('Function: getParameters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider does not exist, it instantiates one and returns the value', async () => {
    // Prepare
    const parameterPath = '/foo';
    const parameterValue = 'bar';
    const client = mockClient(SSMClient)
      .on(GetParametersByPathCommand)
      .resolves({
        Parameters: [
          {
            Name: '/foo/bar',
            Value: parameterValue,
          },
        ],
      });

    // Act
    const parameters: Record<string, string> | undefined =
      await getParameters(parameterPath);

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
    const client = mockClient(SSMClient)
      .on(GetParametersByPathCommand)
      .resolves({
        Parameters: [
          {
            Name: '/foo/bar',
            Value: parameterValue,
          },
        ],
      });

    // Act
    const parameters: Record<string, string> | undefined =
      await getParameters(parameterPath);

    // Assess
    expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
      Path: parameterPath,
    });
    expect(parameters).toEqual({
      bar: parameterValue,
    });
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);
  });

  test('when called and transform `JSON` is specified, it returns an object with correct type', async () => {
    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const parameterPath = '/foo';
    const parameterValue = JSON.stringify({ hello: 'world' });
    const client = mockClient(SSMClient)
      .on(GetParametersByPathCommand)
      .resolves({
        Parameters: [
          {
            Name: '/foo/bar',
            Value: parameterValue,
          },
        ],
      });

    // Act
    const parameters: Record<string, Record<string, unknown>> | undefined =
      await getParameters(parameterPath);

    // Assess
    expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
      Path: parameterPath,
    });
    expect(parameters).toStrictEqual({
      bar: parameterValue,
    });
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);
  });

  test('when called and transform `JSON` is specified as well as an explicit `K` type, it returns a result with correct type', async () => {
    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const parameterPath = '/foo';
    const parameterValue = JSON.stringify(5);
    const client = mockClient(SSMClient)
      .on(GetParametersByPathCommand)
      .resolves({
        Parameters: [
          {
            Name: '/foo/bar',
            Value: parameterValue,
          },
        ],
      });

    // Act
    const parameters: Record<string, Record<string, number>> | undefined =
      await getParameters<Record<string, number>>(parameterPath);

    // Assess
    expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
      Path: parameterPath,
    });
    expect(parameters).toStrictEqual({
      bar: parameterValue,
    });
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);
  });
});
