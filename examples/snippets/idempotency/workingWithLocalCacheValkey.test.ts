import type { Context } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import { handler } from './cachePersistenceLayerValkey.js';

vi.hoisted(() => {
  process.env.CACHE_ENDPOINT = 'localhost';
  process.env.CACHE_PORT = '6379';
});

const context = {
  functionName: 'foo-bar-function',
  memoryLimitInMB: '128',
  invokedFunctionArn:
    'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
  awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  getRemainingTimeInMillis: () => 1234,
} as Context;

describe('Idempotent handler', () => {
  it('returns the same response', async () => {
    // Act
    const response = await handler(
      {
        foo: 'bar',
      },
      context
    );

    // Assess
    expect(response).toEqual({
      paymentId: expect.any(String),
      message: 'success',
      statusCode: 200,
    });
  });
});
