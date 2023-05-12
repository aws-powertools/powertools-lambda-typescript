import type {
  GetOptionsInterface,
  GetMultipleOptionsInterface,
} from './BaseProvider';
import type {
  DynamoDBClient,
  GetItemCommandInput,
  QueryCommandInput,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';

/**
 * Base interface for DynamoDBProviderOptions.
 *
 * @interface
 * @property {string} tableName - The DynamoDB table name.
 * @property {string} [keyAttr] - The DynamoDB table key attribute name. Defaults to 'id'.
 * @property {string} [sortAttr] - The DynamoDB table sort attribute name. Defaults to 'sk'.
 * @property {string} [valueAttr] - The DynamoDB table value attribute name. Defaults to 'value'.
 */
interface DynamoDBProviderOptionsBaseInterface {
  tableName: string;
  keyAttr?: string;
  sortAttr?: string;
  valueAttr?: string;
}

/**
 * Interface for DynamoDBProviderOptions with clientConfig property.
 *
 * @interface
 * @extends DynamoDBProviderOptionsBaseInterface
 * @property {AppConfigDataClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 * @property {never} [awsSdkV3Client] - This property should never be passed.
 */
interface DynamoDBProviderOptionsWithClientConfig
  extends DynamoDBProviderOptionsBaseInterface {
  clientConfig?: DynamoDBClientConfig;
  awsSdkV3Client?: never;
}

/**
 * Interface for DynamoDBProviderOptions with awsSdkV3Client property.
 *
 * @interface
 * @extends DynamoDBProviderOptionsBaseInterface
 * @property {AppConfigDataClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during AppConfigProvider class instantiation
 * @property {never} [clientConfig] - This property should never be passed.
 */
interface DynamoDBProviderOptionsWithClientInstance
  extends DynamoDBProviderOptionsBaseInterface {
  awsSdkV3Client?: DynamoDBClient;
  clientConfig?: never;
}

/**
 * Options for the AppConfigProvider class constructor.
 *
 * @type AppConfigProviderOptions
 * @property {string} tableName - The DynamoDB table name.
 * @property {string} [keyAttr] - The DynamoDB table key attribute name. Defaults to 'id'.
 * @property {string} [sortAttr] - The DynamoDB table sort attribute name. Defaults to 'sk'.
 * @property {string} [valueAttr] - The DynamoDB table value attribute name. Defaults to 'value'.
 * @property {AppConfigDataClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with awsSdkV3Client.
 * @property {AppConfigDataClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during DynamoDBProvider class instantiation. Mutually exclusive with clientConfig.
 */
type DynamoDBProviderOptions =
  | DynamoDBProviderOptionsWithClientConfig
  | DynamoDBProviderOptionsWithClientInstance;

/**
 * Options for the DynamoDBProvider get method.
 *
 * @interface DynamoDBGetOptionsInterface
 * @extends {GetOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {GetItemCommandInput} [sdkOptions] - Additional options to pass to the AWS SDK v3 client.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 */
interface DynamoDBGetOptionsInterface extends GetOptionsInterface {
  sdkOptions?: Omit<
    Partial<GetItemCommandInput>,
    'Key' | 'TableName' | 'ProjectionExpression'
  >;
}

/**
 * Options for the DynamoDBProvider getMultiple method.
 *
 * @interface DynamoDBGetMultipleOptionsInterface
 * @extends {GetMultipleOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {QueryCommandInput} [sdkOptions] - Additional options to pass to the AWS SDK v3 client.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 * @property {boolean} throwOnTransformError - Whether to throw an error if the transform fails (default: `true`)
 */
interface DynamoDBGetMultipleOptionsInterface
  extends GetMultipleOptionsInterface {
  sdkOptions?: Partial<QueryCommandInput>;
}

export type {
  DynamoDBProviderOptions,
  DynamoDBGetOptionsInterface,
  DynamoDBGetMultipleOptionsInterface,
};
