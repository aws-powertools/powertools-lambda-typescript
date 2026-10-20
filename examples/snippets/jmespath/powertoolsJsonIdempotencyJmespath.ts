import { randomUUID } from 'node:crypto';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { APIGatewayEvent } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'IdempotencyTable',
});

export const handler = makeIdempotent(
  async (event: APIGatewayEvent) => {
    const body = JSON.parse(event.body || '{}');
    const { user, productId } = body;

    const result = await createSubscriptionPayment(user, productId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        paymentId: result.id,
        message: 'success',
      }),
    };
  },
  {
    persistenceStore,
    config: new IdempotencyConfig({
      eventKeyJmesPath: 'powertools_json(body)',
    }),
  }
);

const createSubscriptionPayment = async (
  user: string,
  productId: string
): Promise<{ id: string; message: string }> => {
  const payload = { user, productId };
  const response = await fetch('https://httpbin.org/anything', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create subscription payment');
  }

  return { id: randomUUID(), message: 'paid' };
};
