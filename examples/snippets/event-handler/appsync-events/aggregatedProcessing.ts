import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import {
  BatchWriteItemCommand,
  DynamoDBClient,
  type WriteRequest,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import type { Context } from 'aws-lambda';

const ddbClient = new DynamoDBClient();
const app = new AppSyncEventsResolver();

app.onPublish(
  '/default/foo/*',
  async (payloads) => {
    const writeOperations: WriteRequest[] = [];
    for (const payload of payloads) {
      writeOperations.push({
        PutRequest: {
          Item: marshall(payload),
        },
      });
    }
    await ddbClient.send(
      new BatchWriteItemCommand({
        RequestItems: {
          'your-table-name': writeOperations,
        },
      })
    );

    return payloads;
  },
  { aggregate: true }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
