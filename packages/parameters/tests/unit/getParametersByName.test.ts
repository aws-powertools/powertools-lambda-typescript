import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROVIDERS } from '../../src/base/index.js';
import { SSMProvider, getParametersByName } from '../../src/ssm/index.js';
import type { SSMGetParametersByNameOptions } from '../../src/types/SSMProvider.js';

describe('Function: getParametersByName', () => {
  const client = mockClient(SSMClient);

  beforeEach(() => {
    vi.clearAllMocks();
    client.reset();
  });

  it('instantiates a new client and returns the value when no default provider exists', async () => {
    // Prepare
    const parameters: Record<string, SSMGetParametersByNameOptions> = {
      '/foo/bar': {
        maxAge: 1000,
      },
      '/foo/baz': {
        maxAge: 2000,
        transform: 'json',
      },
    };
    mockClient(SSMClient)
      .on(GetParametersCommand)
      .resolves({
        Parameters: [
          {
            Name: '/foo/bar',
            Value: 'bar',
          },
          {
            Name: '/foo/baz',
            Value: '{"baz": "qux"}',
          },
        ],
      });
    const getParametersByNameSpy = vi.spyOn(
      SSMProvider.prototype,
      'getParametersByName'
    );

    // Act
    await getParametersByName(parameters);

    // Assess
    expect(getParametersByNameSpy).toHaveBeenCalledWith(parameters, undefined);
  });

  it('uses the cached provider when one is present in the cache', async () => {
    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const parameters = {
      '/foo/bar': {
        maxAge: 1000,
      },
      '/foo/baz': {
        maxAge: 2000,
      },
    };
    mockClient(SSMClient)
      .on(GetParametersCommand)
      .resolves({
        Parameters: [
          {
            Name: '/foo/bar',
            Value: 'bar',
          },
          {
            Name: '/foo/baz',
            Value: 'baz',
          },
        ],
      });
    const getParametersByNameSpy = vi.spyOn(provider, 'getParametersByName');

    // Act
    await getParametersByName(parameters);

    // Assess
    expect(getParametersByNameSpy).toHaveBeenCalledWith(parameters, undefined);
    expect(DEFAULT_PROVIDERS.ssm).toBe(provider);
  });
});
