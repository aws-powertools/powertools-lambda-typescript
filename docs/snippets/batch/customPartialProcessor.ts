import { randomInt } from 'node:crypto';
import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
  BasePartialProcessor,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type {
  SuccessResponse,
  FailureResponse,
  EventSourceType,
} from '@aws-lambda-powertools/batch';
import type { SQSEvent, Context, SQSBatchResponse } from 'aws-lambda';

const tableName = process.env.TABLE_NAME || 'table-not-found';

class MyPartialProcessor extends BasePartialProcessor {
  #tableName: string;
  #client?: DynamoDBClient;

  public constructor(tableName: string) {
    super();
    this.#tableName = tableName;
  }

  public async asyncProcessRecord(
    _record: EventSourceType
  ): Promise<SuccessResponse | FailureResponse> {
    throw new Error('Not implemented');
  }

  /**
   * It's called once, **after** processing the batch.
   *
   * Here we are writing all the processed messages to DynamoDB.
   */
  public clean(): void {
    // We know that the client is defined because clean() is called after prepare()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.#client!.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [this.#tableName]: this.successMessages.map((message) => ({
            PutRequest: {
              Item: marshall(message),
            },
          })),
        },
      })
    );
  }

  /**
   * It's called once, **before** processing the batch.
   *
   * It initializes a new client and cleans up any existing data.
   */
  public prepare(): void {
    this.#client = new DynamoDBClient({});
    this.successMessages = [];
  }

  /**
   * It handles how your record is processed.
   *
   * Here we are keeping the status of each run, `this.handler` is
   * the function that is passed when calling `processor.register()`.
   */
  public processRecord(
    record: EventSourceType
  ): SuccessResponse | FailureResponse {
    try {
      const result = this.handler(record);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }
}

const processor = new MyPartialProcessor(tableName);

const recordHandler = (): number => {
  return Math.floor(randomInt(1, 10));
};

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  return processPartialResponse(event, recordHandler, processor, {
    context,
  });
};
