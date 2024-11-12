import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROVIDERS } from '../../src/base/index.js';
import { SSMProvider, getParameter } from '../../src/ssm/index.js';

describe('Function: getParameter', () => {
  const client = mockClient(SSMClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('instantiates a new client and returns the value when no default provider exists', async () => {
    // Prepare
    const parameterName = 'foo';
    const parameterValue = 'foo';
    client.on(GetParameterCommand).resolves({
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

  it('uses the cached provider when one is present in the cache', async () => {
    // Prepare
    const provider = new SSMProvider();
    DEFAULT_PROVIDERS.ssm = provider;
    const parameterName = 'foo';
    const parameterValue = 'foo';
    client.on(GetParameterCommand).resolves({
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
