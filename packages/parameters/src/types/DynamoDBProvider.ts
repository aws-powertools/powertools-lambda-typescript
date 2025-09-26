import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type {
  DynamoDBClient,
  DynamoDBClientConfig,
  GetItemCommandInput,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import type { DynamoDBProvider } from '../dynamodb/DynamoDBProvider.js';
import type {
  GetMultipleOptionsInterface,
  GetOptionsInterface,
} from './BaseProvider.js';

/**
 * Base interface for {@link DynamoDBProviderOptions | `DynamoDBProviderOptions`}.
 *
 * @property tableName - The DynamoDB table name.
 * @property keyAttr - Optional DynamoDB table key attribute name. Defaults to 'id'.
 * @property sortAttr - Optional DynamoDB table sort attribute name. Defaults to 'sk'.
 * @property valueAttr - Optional DynamoDB table value attribute name. Defaults to 'value'.
 */
interface DynamoDBProviderOptionsBase {
  /**
   * The DynamoDB table name.
   */
  tableName: string;
  /**
   * Optional DynamoDB table key attribute name. Defaults to 'id'.
   */
  keyAttr?: string;
  /**
   * Optional DynamoDB table sort attribute name. Defaults to 'sk'.
   */
  sortAttr?: string;
  /**
   * Optional DynamoDB table value attribute name. Defaults to 'value'.
   */
  valueAttr?: string;
}

/**
 * Interface for {@link DynamoDBProviderOptions | `DynamoDBProviderOptions`} with `clientConfig` property.
 *
 * @property clientConfig - Optional configuration to pass during client initialization, e.g. AWS region. Accepts the same options as the AWS SDK v3 client ({@link DynamoDBClient | `DynamoDBClient`}).
 * @property awsSdkV3Client - This property should never be passed when using `clientConfig`.
 */
interface DynamoDBProviderOptionsWithClientConfig
  extends DynamoDBProviderOptionsBase {
  /**
   * Optional configuration to pass during client initialization, e.g. AWS region. Accepts the same options as the AWS SDK v3 client ({@link DynamoDBClient | `DynamoDBClient`}).
   */
  clientConfig?: DynamoDBClientConfig;
  /**
   * This property should never be passed when using `clientConfig`.
   */
  awsSdkV3Client?: never;
}

/**
 * Interface for {@link DynamoDBProviderOptions | `DynamoDBProviderOptions`} with `awsSdkV3Client` property.
 *
 * @property awsSdkV3Client - Optional AWS SDK v3 client to pass during `DynamoDBProvider` class instantiation, should be an instance of {@link DynamoDBClient | `DynamoDBClient`}.
 * @property clientConfig - This property should never be passed when using `awsSdkV3Client`.
 */
interface DynamoDBProviderOptionsWithClientInstance
  extends DynamoDBProviderOptionsBase {
  /**
   * Optional AWS SDK v3 client instance ({@link DynamoDBClient | `DynamoDBClient`}) to use for DynamoDB operations. If not provided, we will create a new instance of the client.
   */
  awsSdkV3Client?: DynamoDBClient;
  /**
   * This property should never be passed when using `awsSdkV3Client`.
   */
  clientConfig?: never;
}

/**
 * Options for the {@link DynamoDBProvider | `DynamoDBProvider`} class constructor.
 *
 * @property tableName - The DynamoDB table name.
 * @property keyAttr - Optional DynamoDB table key attribute name. Defaults to 'id'.
 * @property sortAttr - Optional DynamoDB table sort attribute name. Defaults to 'sk'.
 * @property valueAttr - Optional DynamoDB table value attribute name. Defaults to 'value'.
 * @property clientConfig - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with `awsSdkV3Client`, accepts the same options as the AWS SDK v3 client ({@link DynamoDBClient | `DynamoDBClient`}).
 * @property awsSdkV3Client - Optional AWS SDK v3 client to pass during DynamoDBProvider class instantiation. Mutually exclusive with `clientConfig`, should be an instance of {@link DynamoDBClient | `DynamoDBClient`}.
 */
type DynamoDBProviderOptions =
  | DynamoDBProviderOptionsWithClientConfig
  | DynamoDBProviderOptionsWithClientInstance;

/**
 * Options for the {@link DynamoDBProvider.get | `DynamoDBProvider.get()`} get method.
 *
 * @property maxAge - Maximum age of the value in the cache, in seconds.
 * @property forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property sdkOptions - Additional options to pass to the AWS SDK v3 client, supports all options from {@link GetItemCommandInput | `GetItemCommandInput`} except `Key`, `TableName`, and `ProjectionExpression`.
 * @property transform - Transform to be applied, can be 'json' or 'binary'.
 */
interface DynamoDBGetOptionsBase extends GetOptionsInterface {
  /**
   * Additional options to pass to the AWS SDK v3 client, supports all options from {@link GetItemCommandInput | `GetItemCommandInput`} except `Key`, `TableName`, and `ProjectionExpression`.
   */
  sdkOptions?: Omit<
    Partial<GetItemCommandInput>,
    'Key' | 'TableName' | 'ProjectionExpression'
  >;
}

interface DynamoDBGetOptionsTransformJson extends DynamoDBGetOptionsBase {
  transform: 'json';
}

interface DynamoDBGetOptionsTransformBinary extends DynamoDBGetOptionsBase {
  transform: 'binary';
}

interface DynamoDBGetOptionsTransformNone extends DynamoDBGetOptionsBase {
  transform?: never;
}

/**
 * Options for the {@link DynamoDBProvider.get | `DynamoDBProvider.get()`} get method.
 *
 * @property maxAge - Maximum age of the value in the cache, in seconds.
 * @property forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property sdkOptions - Additional options to pass to the AWS SDK v3 client, supports all options from {@link GetItemCommandInput | `GetItemCommandInput`} except `Key`, `TableName`, and `ProjectionExpression`.
 * @property transform - Transform to be applied, can be 'json' or 'binary'.
 */
type DynamoDBGetOptions =
  | DynamoDBGetOptionsTransformNone
  | DynamoDBGetOptionsTransformJson
  | DynamoDBGetOptionsTransformBinary
  | undefined;

/**
 * Generic output type for {@link DynamoDBProvider.get | `DynamoDBProvider.get()`} method.
 */
type DynamoDBGetOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined,
> = undefined extends ExplicitUserProvidedType
  ? undefined extends InferredFromOptionsType
    ? JSONValue
    : InferredFromOptionsType extends
          | DynamoDBGetOptionsTransformNone
          | DynamoDBGetOptionsTransformJson
      ? JSONValue
      : InferredFromOptionsType extends DynamoDBGetOptionsTransformBinary
        ? string
        : never
  : ExplicitUserProvidedType;

/**
 * Options for the {@link DynamoDBProvider.getMultiple | `DynamoDBProvider.getMultiple()`} method.
 *
 * @property maxAge - Maximum age of the value in the cache, in seconds.
 * @property forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property sdkOptions - Additional options to pass to the AWS SDK v3 client, supports all options from {@link QueryCommandInput | `QueryCommandInput`} except `TableName` and `KeyConditionExpression`.
 * @property transform - Transform to be applied, can be 'json' or 'binary'.
 * @property throwOnTransformError - Whether to throw an error if the transform fails (default: `true`)
 */
interface DynamoDBGetMultipleOptionsBase extends GetMultipleOptionsInterface {
  sdkOptions?: Partial<QueryCommandInput>;
}

interface DynamoDBGetMultipleOptionsTransformJson
  extends DynamoDBGetMultipleOptionsBase {
  transform: 'json';
}

interface DynamoDBGetMultipleOptionsTransformBinary
  extends DynamoDBGetMultipleOptionsBase {
  transform: 'binary';
}

interface DynamoDBGetMultipleOptionsTransformAuto
  extends DynamoDBGetMultipleOptionsBase {
  transform: 'auto';
}

interface DynamoDBGetMultipleOptionsTransformNone
  extends DynamoDBGetMultipleOptionsBase {
  transform?: never;
}

type DynamoDBGetMultipleOptions =
  | DynamoDBGetMultipleOptionsTransformJson
  | DynamoDBGetMultipleOptionsTransformBinary
  | DynamoDBGetMultipleOptionsTransformAuto
  | DynamoDBGetMultipleOptionsTransformNone;

/**
 * Generic output type for {@link DynamoDBProvider.getMultiple | `DynamoDBProvider.getMultiple()`} method.
 */
type DynamoDBGetMultipleOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined,
> = undefined extends ExplicitUserProvidedType
  ? undefined extends InferredFromOptionsType
    ? JSONValue
    : InferredFromOptionsType extends
          | DynamoDBGetMultipleOptionsTransformNone
          | DynamoDBGetMultipleOptionsTransformAuto
          | DynamoDBGetMultipleOptionsTransformJson
      ? JSONValue
      : InferredFromOptionsType extends DynamoDBGetOptionsTransformBinary
        ? string
        : never
  : ExplicitUserProvidedType;

export type {
  DynamoDBProviderOptions,
  DynamoDBGetOptions,
  DynamoDBGetOutput,
  DynamoDBGetMultipleOptions,
  DynamoDBGetMultipleOutput,
};
