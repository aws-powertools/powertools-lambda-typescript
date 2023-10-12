import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type {
  DynamoDBClient,
  DynamoDBClientConfig,
  GetItemCommandInput,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import type {
  GetMultipleOptionsInterface,
  GetOptionsInterface,
} from './BaseProvider.js';

/**
 * Base interface for DynamoDBProviderOptions.
 *
 * @interface
 * @property {string} tableName - The DynamoDB table name.
 * @property {string} [keyAttr] - The DynamoDB table key attribute name. Defaults to 'id'.
 * @property {string} [sortAttr] - The DynamoDB table sort attribute name. Defaults to 'sk'.
 * @property {string} [valueAttr] - The DynamoDB table value attribute name. Defaults to 'value'.
 */
interface DynamoDBProviderOptionsBase {
  tableName: string;
  keyAttr?: string;
  sortAttr?: string;
  valueAttr?: string;
}

/**
 * Interface for DynamoDBProviderOptions with clientConfig property.
 *
 * @interface
 * @extends DynamoDBProviderOptionsBase
 * @property {DynamoDBClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 * @property {never} [awsSdkV3Client] - This property should never be passed.
 */
interface DynamoDBProviderOptionsWithClientConfig
  extends DynamoDBProviderOptionsBase {
  /**
   * Optional configuration to pass during client initialization, e.g. AWS region. It accepts the same configuration object as the AWS SDK v3 client (`DynamoDBClient`).
   */
  clientConfig?: DynamoDBClientConfig;
  awsSdkV3Client?: never;
}

/**
 * Interface for DynamoDBProviderOptions with awsSdkV3Client property.
 *
 * @interface
 * @extends DynamoDBProviderOptionsBase
 * @property {DynamoDBClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during DynamoDBProvider class instantiation
 * @property {never} [clientConfig] - This property should never be passed.
 */
interface DynamoDBProviderOptionsWithClientInstance
  extends DynamoDBProviderOptionsBase {
  /**
   * Optional AWS SDK v3 client instance (`DynamoDBClient`) to use for DynamoDB operations. If not provided, we will create a new instance of `DynamoDBClient`.
   */
  awsSdkV3Client?: DynamoDBClient;
  clientConfig?: never;
}

/**
 * Options for the DynamoDBProvider class constructor.
 *
 * @type DynamoDBProviderOptions
 * @property {string} tableName - The DynamoDB table name.
 * @property {string} [keyAttr] - The DynamoDB table key attribute name. Defaults to 'id'.
 * @property {string} [sortAttr] - The DynamoDB table sort attribute name. Defaults to 'sk'.
 * @property {string} [valueAttr] - The DynamoDB table value attribute name. Defaults to 'value'.
 * @property {DynamoDBClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with awsSdkV3Client.
 * @property {DynamoDBClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during DynamoDBProvider class instantiation. Mutually exclusive with clientConfig.
 */
type DynamoDBProviderOptions =
  | DynamoDBProviderOptionsWithClientConfig
  | DynamoDBProviderOptionsWithClientInstance;

/**
 * Options for the DynamoDBProvider get method.
 *
 * @interface DynamoDBGetOptionsBase
 * @extends {GetOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {GetItemCommandInput} [sdkOptions] - Additional options to pass to the AWS SDK v3 client.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 */
interface DynamoDBGetOptionsBase extends GetOptionsInterface {
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

type DynamoDBGetOptions =
  | DynamoDBGetOptionsTransformNone
  | DynamoDBGetOptionsTransformJson
  | DynamoDBGetOptionsTransformBinary
  | undefined;

/**
 * Generic output type for DynamoDBProvider get method.
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
 * Options for the DynamoDBProvider getMultiple method.
 *
 * @interface DynamoDBGetMultipleOptions
 * @extends {GetMultipleOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {QueryCommandInput} [sdkOptions] - Additional options to pass to the AWS SDK v3 client.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 * @property {boolean} throwOnTransformError - Whether to throw an error if the transform fails (default: `true`)
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
 * Generic output type for DynamoDBProvider getMultiple method.
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
