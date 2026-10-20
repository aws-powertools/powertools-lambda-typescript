import type { MSKEvent } from '@aws-lambda-powertools/kafka/types';
import type { Context } from 'aws-lambda';
import { expect, it } from 'vitest';
import { handler } from './gettingStartedPrimitiveValues.js';

it('handles complex protobuf messages from Glue Schema Registry', async () => {
  // Prepare
  const event = {
    eventSource: 'aws:kafka',
    eventSourceArn:
      'arn:aws:kafka:us-east-1:123456789012:cluster/MyCluster/12345678-1234-1234-1234-123456789012-1',
    bootstrapServers:
      'b-1.mskcluster.abcde12345.us-east-1.kafka.amazonaws.com:9092',
    records: {
      'orders-topic': [
        {
          topic: 'orders-topic',
          partition: 0,
          offset: 15,
          timestamp: 1545084650987,
          timestampType: 'CREATE_TIME',
          headers: [],
          key: undefined,
          keySchemaMetadata: {
            dataFormat: 'JSON',
          },
          valueSchemaMetadata: {
            dataFormat: 'JSON',
            schemaId: undefined,
          },
          value: Buffer.from(
            JSON.stringify({ order_id: '12345', amount: 99.95 })
          ).toString('base64'),
        },
      ],
    },
  } as MSKEvent;

  // Act
  const result = await handler(event, {} as Context);

  // Assess
  expect(result).toBeDefined();
  // You can add more specific assertions based on your handler's logic
});
