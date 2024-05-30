import { randomInt } from 'node:crypto';
import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
  EventType,
  BasePartialBatchProcessor,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type {
  SuccessResponse,
  FailureResponse,
  BaseRecord,
} from '@aws-lambda-powertools/batch/types';
import type { SQSHandler } from 'aws-lambda';

const tableName = process.env.TABLE_NAME || 'table-not-found';

class MyPartialProcessor extends BasePartialBatchProcessor {
  #tableName: string;
  #client?: DynamoDBClient;

  public constructor(tableName: string) {
    super(EventType.SQS);
    this.#tableName = tableName;
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

  public async processRecord(
    _record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    throw new Error('Not implemented');
  }

  /**
   * It handles how your record is processed.
   *
   * Here we are keeping the status of each run, `this.handler` is
   * the function that is passed when calling `processor.register()`.
   */
  public processRecordSync(
    record: BaseRecord
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

export const handler: SQSHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });
