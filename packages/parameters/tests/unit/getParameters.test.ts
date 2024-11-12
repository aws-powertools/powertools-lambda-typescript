import { GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROVIDERS } from '../../src/base/index.js';
import { SSMProvider, getParameters } from '../../src/ssm/index.js';

describe('Function: getParameters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('instantiates a new client and returns the value when no default provider exists', async () => {
    // Prepare
    const parameterPath = '/foo';
    const parameterValue = 'bar';
    mockClient(SSMClient)
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
    expect(parameters).toEqual({
      bar: parameterValue,
    });
  });

  it('uses the cached provider when one is present in the cache', async () => {
    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const parameterPath = '/foo';
    const parameterValue = 'bar';
    mockClient(SSMClient)
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
    expect(parameters).toEqual({
      bar: parameterValue,
    });
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);
  });
});
