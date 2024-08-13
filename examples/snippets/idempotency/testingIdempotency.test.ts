import type { Context } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as API_GATEWAY_EXAMPLE_EVENT from './samples/testingIdempotency.json';
import { idempotentHandler } from './testingIdempotency';

describe('Idempotent Handler', () => {
  const ddb = new DocumentClient({});

  it('should return the same response for the same request', async () => {
    // given
    const context = {} as Context;

    const firstRequest = API_GATEWAY_EXAMPLE_EVENT;

    // modify time field to simulate a different request
    const secondRequest = {
      ...API_GATEWAY_EXAMPLE_EVENT,
      requestContext: {
        ...API_GATEWAY_EXAMPLE_EVENT.requestContext,
        time: 1612964493723,
      },
    };

    // when
    const firstResponse = await idempotentHandler(firstRequest, context);
    const secondResponse = await idempotentHandler(secondRequest, context);
    // then
    expect(firstResponse).toEqual(secondResponse);
    // check if we only have one item in the table
    const idempotencyRecords = await ddb
      .scan({ TableName: 'idempotency-store' })
      .promise();

    expect(idempotencyRecords.Items).toHaveLength(1);
    expect(idempotencyRecords.Items?.[0].status).toEqual('COMPLETED');
    expect(idempotencyRecords.Items?.[0].data).toEqual(firstResponse);
  });
});
