import type {
  DynamoDBClient,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';

/**
 * Base interface for DynamoPersistenceOptions.
 *
 * @interface
 * @property {string} tableName - The DynamoDB table name.
 * @property {string} [keyAttr] - The DynamoDB table key attribute name. Defaults to 'id'.
 * @property {string} [expiryAttr] - The DynamoDB table expiry attribute name. Defaults to 'expiration'.
 * @property {string} [inProgressExpiryAttr] - The DynamoDB table in progress expiry attribute name. Defaults to 'in_progress_expiry_attr'.
 * @property {string} [statusAttr] - The DynamoDB table status attribute name. Defaults to 'status'.
 * @property {string} [dataAttr] - The DynamoDB table data attribute name. Defaults to 'data'.
 * @property {string} [validationKeyAttr] - The DynamoDB table validation key attribute name. Defaults to 'validation'.
 * @property {string} [sortKeyAttr] - The DynamoDB table sort key attribute name, use only when table has one. Defaults to undefined.
 * @property {string} [staticPkValue] - The DynamoDB table static partition key value, use only with sortKeyAttr. Defaults to `idempotency#{LAMBDA_FUNCTION_NAME}`.
 */
interface DynamoPersistenceOptionsBaseInterface {
  tableName: string
  keyAttr?: string
  expiryAttr?: string
  inProgressExpiryAttr?: string
  statusAttr?: string
  dataAttr?: string
  validationKeyAttr?: string
  sortKeyAttr?: string
  staticPkValue?: string
}

/**
 * Interface for DynamoPersistenceOptions with clientConfig property.
 *
 * @interface
 * @extends DynamoPersistenceOptionsBaseInterface
 * @property {DynamoDBClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 * @property {never} [awsSdkV3Client] - This property should never be passed.
 */
interface DynamoPersistenceOptionsWithClientConfig extends DynamoPersistenceOptionsBaseInterface {
  clientConfig?: DynamoDBClientConfig
  awsSdkV3Client?: never
}

/**
 * Interface for DynamoPersistenceOptions with awsSdkV3Client property.
 *
 * @interface
 * @extends DynamoPersistenceOptionsBaseInterface
 * @property {DynamoDBClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during AppConfigProvider class instantiation
 * @property {never} [clientConfig] - This property should never be passed.
 */
interface DynamoPersistenceOptionsWithClientInstance extends DynamoPersistenceOptionsBaseInterface {
  awsSdkV3Client?: DynamoDBClient
  clientConfig?: never
}

/**
 * Options for the AppConfigProvider class constructor.
 *
 * @type AppConfigProviderOptions
 * @property {string} tableName - The DynamoDB table name.
 * @property {string} [keyAttr] - The DynamoDB table key attribute name. Defaults to 'id'.
 * @property {string} [expiryAttr] - The DynamoDB table expiry attribute name. Defaults to 'expiration'.
 * @property {string} [inProgressExpiryAttr] - The DynamoDB table in progress expiry attribute name. Defaults to 'in_progress_expiry_attr'.
 * @property {string} [statusAttr] - The DynamoDB table status attribute name. Defaults to 'status'.
 * @property {string} [dataAttr] - The DynamoDB table data attribute name. Defaults to 'data'.
 * @property {string} [validationKeyAttr] - The DynamoDB table validation key attribute name. Defaults to 'validation'.
 * @property {string} [sortKeyAttr] - The DynamoDB table sort key attribute name, use only when table has one. Defaults to undefined.
 * @property {string} [staticPkValue] - The DynamoDB table static partition key value, use only with sortKeyAttr. Defaults to `idempotency#{LAMBDA_FUNCTION_NAME}`.
 * @property {DynamoDBClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with awsSdkV3Client.
 * @property {DynamoDBClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during DynamoDBProvider class instantiation. Mutually exclusive with clientConfig.
 */
type DynamoPersistenceOptions = DynamoPersistenceOptionsWithClientConfig | DynamoPersistenceOptionsWithClientInstance;

export type {
  DynamoPersistenceOptions,
};