import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { CachePersistenceLayer } from '@aws-lambda-powertools/idempotency/cache';
import { GlideClient } from '@valkey/valkey-glide';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { handler } from './workingWithLocalDynamoDB.js';

const context = {
  functionName: 'foo-bar-function',
  memoryLimitInMB: '128',
  invokedFunctionArn:
    'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
  awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  getRemainingTimeInMillis: () => 1234,
} as Context;

// Initialize the Glide client with local Glide server
const client = await GlideClient.createClient({
  addresses: [
    {
      host: 'localhost',
      port: 6379,
    },
  ],
  requestTimeout: 5000,
});

const mockPersistenceStore = new CachePersistenceLayer({
  client,
});

describe('Idempotent handler', () => {
  it('returns the same response', async () => {
    // Prepare
    const idempotentHandler = makeIdempotent(handler, {
      persistenceStore: mockPersistenceStore,
    });

    // Act
    const response = await idempotentHandler(
      {
        foo: 'bar',
      },
      context
    );

    // Assess
    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        paymentId: '123',
        message: 'Payment created',
      }),
    });
  });
});
