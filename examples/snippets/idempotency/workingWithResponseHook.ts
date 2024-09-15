import { randomUUID } from 'node:crypto';
import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { IdempotencyRecord } from '@aws-lambda-powertools/idempotency/persistence';
import type { Context } from 'aws-lambda';
import type { Request, Response, SubscriptionResult } from './types.js';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const responseHook = (response: JSONValue, record: IdempotencyRecord) => {
  // Return inserted Header data into the Idempotent Response
  (response as Response).headers = {
    'x-idempotency-key': record.idempotencyKey,
  };

  // Must return the response here
  return response as JSONValue;
};

const config = new IdempotencyConfig({
  responseHook,
});

const createSubscriptionPayment = async (
  event: Request
): Promise<SubscriptionResult> => {
  // ... create payment
  return {
    id: randomUUID(),
    productId: event.productId,
  };
};

export const handler = makeIdempotent(
  async (event: Request, _context: Context): Promise<Response> => {
    try {
      const payment = await createSubscriptionPayment(event);

      return {
        paymentId: payment.id,
        message: 'success',
        statusCode: 200,
      };
    } catch (error) {
      throw new Error('Error creating payment');
    }
  },
  {
    persistenceStore,
    config,
  }
);
