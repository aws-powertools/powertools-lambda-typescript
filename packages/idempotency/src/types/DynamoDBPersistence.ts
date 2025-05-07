import type {
  DynamoDBClient,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import type { BasePersistenceOptions } from './BasePersistenceLayer.js';

/**
 * Base interface for DynamoPersistenceOptions.
 *
 * @see {@link BasePersistenceOptions} for full list of properties.
 *
 * @interface
 * @property {string} tableName - The DynamoDB table name.
 * @property {string} [keyAttr] - The DynamoDB table key attribute name. Defaults to 'id'.
 * @property {string} [sortKeyAttr] - The DynamoDB table sort key attribute name, use only when table has one. Defaults to undefined.
 * @property {string} [staticPkValue] - The DynamoDB table static partition key value, use only with sortKeyAttr. Defaults to `idempotency#{LAMBDA_FUNCTION_NAME}`.
 */
interface DynamoDBPersistenceOptionsBase extends BasePersistenceOptions {
  tableName: string;
  keyAttr?: string;
  sortKeyAttr?: string;
  staticPkValue?: string;
}

/**
 * Interface for DynamoDBPersistenceOptions with clientConfig property.
 *
 * @interface
 * @property {DynamoDBClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 * @property {never} [awsSdkV3Client] - This property should never be passed.
 */
interface DynamoDBPersistenceOptionsWithClientConfig
  extends DynamoDBPersistenceOptionsBase {
  awsSdkV3Client?: never;
  /**
   * Optional configuration to pass during client initialization, e.g. AWS region. It accepts the same configuration object as the AWS SDK v3 client (`DynamoDBClient`).
   */
  clientConfig?: DynamoDBClientConfig;
}

/**
 * Interface for DynamoDBPersistenceOptions with awsSdkV3Client property.
 *
 * @interface
 * @property {DynamoDBClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during DynamoDB client instantiation
 * @property {never} [clientConfig] - This property should never be passed.
 */
interface DynamoDBPersistenceOptionsWithClientInstance
  extends DynamoDBPersistenceOptionsBase {
  /**
   * Optional AWS SDK v3 client instance (`DynamoDBClient`) to use for DynamoDB operations. If not provided, we will create a new instance of `DynamoDBClient`.
   */
  awsSdkV3Client?: DynamoDBClient;
  clientConfig?: never;
}

/**
 * Options for the {@link persistence/DynamoDBPersistenceLayer.DynamoDBPersistenceLayer | DynamoDBPersistenceLayer} class constructor.
 *
 * @see {@link BasePersistenceOptions}, {@link DynamoDBPersistenceOptionsBase}, {@link DynamoDBPersistenceOptionsWithClientConfig},
 * {@link DynamoDBPersistenceOptionsWithClientInstance} for full list of properties.
 *
 * @type DynamoDBPersistenceOptions
 * @property {string} tableName - The DynamoDB table name.
 * @property {string} [keyAttr] - The DynamoDB table key attribute name. Defaults to 'id'.
 * @property {string} [sortKeyAttr] - The DynamoDB table sort key attribute name, use only when table has one. Defaults to undefined.
 * @property {string} [staticPkValue] - The DynamoDB table static partition key value, use only with sortKeyAttr. Defaults to `idempotency#{LAMBDA_FUNCTION_NAME}`.
 * @property {DynamoDBClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with awsSdkV3Client.
 * @property {DynamoDBClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during DynamoDBProvider class instantiation. Mutually exclusive with clientConfig.
 */
type DynamoDBPersistenceOptions =
  | DynamoDBPersistenceOptionsWithClientConfig
  | DynamoDBPersistenceOptionsWithClientInstance;

export type {
  DynamoDBPersistenceOptionsBase,
  DynamoDBPersistenceOptionsWithClientConfig,
  DynamoDBPersistenceOptionsWithClientInstance,
  DynamoDBPersistenceOptions,
};
