import type { GetOptionsInterface, GetMultipleOptionsInterface } from './BaseProvider';
import type { GetItemCommandInput, QueryCommandInput, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

interface DynamoDBProviderOptions {
  tableName: string
  keyAttr?: string
  sortAttr?: string
  valueAttr?: string
  clientConfig?: DynamoDBClientConfig
}

/**
 * Options for the DynamoDBProvider get method.
 * 
 * @interface DynamoDBGetOptionsInterface
 * @extends {GetOptionsInterface}
 * @property {boolean} decrypt - If true, the parameter will be decrypted.
 * @property {Partial<GetItemCommandInput>} sdkOptions - Options for the AWS SDK.
 */
interface DynamoDBGetOptionsInterface extends GetOptionsInterface {
  sdkOptions?: Omit<Partial<GetItemCommandInput>, 'Key' | 'TableName' | 'ProjectionExpression'>
}

interface DynamoDBGetMultipleOptionsInterface extends GetMultipleOptionsInterface {
  sdkOptions?: Partial<QueryCommandInput>
}

export type {
  DynamoDBProviderOptions,
  DynamoDBGetOptionsInterface,
  DynamoDBGetMultipleOptionsInterface,
};