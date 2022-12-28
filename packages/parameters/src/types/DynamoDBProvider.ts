import type { TransformOptions } from './BaseProvider';
import type { GetItemCommandInput, QueryCommandInput, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

// TODO: move this to BaseProvider.ts
interface GetBaseOptionsInterface {
  maxAge?: number
  forceFetch?: boolean
  decrypt?: boolean
  transform?: TransformOptions
}

// TODO: move this to BaseProvider.ts
interface GetMultipleBaseOptionsInterface extends GetBaseOptionsInterface {
  throwOnTransformError?: boolean
}

interface DynamoDBProviderOptions {
  tableName: string
  keyAttr?: string
  sortAttr?: string
  valueAttr?: string
  clientConfig?: DynamoDBClientConfig
}

interface DynamoDBGetOptionsInterface {
  maxAge?: number
  forceFetch?: boolean
  decrypt?: boolean
  transform?: TransformOptions
  sdkOptions?: Partial<GetItemCommandInput>
}

interface DynamoDBGetMultipleOptionsInterface extends GetMultipleBaseOptionsInterface {
  sdkOptions?: Partial<QueryCommandInput>
}

export type {
  DynamoDBProviderOptions,
  DynamoDBGetOptionsInterface,
  DynamoDBGetMultipleOptionsInterface,
};