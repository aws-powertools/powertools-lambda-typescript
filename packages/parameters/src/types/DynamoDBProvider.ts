import type { GetOptionsInterface, GetMultipleOptionsInterface } from './BaseProvider';
import type { DynamoDBClient, GetItemCommandInput, QueryCommandInput, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

interface DynamoDBProviderOptionsBaseInterface {
  tableName: string
  keyAttr?: string
  sortAttr?: string
  valueAttr?: string
}

interface DynamoDBProviderOptionsWithClientConfig extends DynamoDBProviderOptionsBaseInterface {
  clientConfig?: DynamoDBClientConfig
  awsSdkV3Client?: never
}

interface DynamoDBProviderOptionsWithClientInstance extends DynamoDBProviderOptionsBaseInterface {
  awsSdkV3Client?: DynamoDBClient
  clientConfig?: never
}

type DynamoDBProviderOptions = DynamoDBProviderOptionsWithClientConfig | DynamoDBProviderOptionsWithClientInstance;

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