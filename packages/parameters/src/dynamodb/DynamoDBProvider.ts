import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import {
  DynamoDBClient,
  type DynamoDBPaginationConfiguration,
  GetItemCommand,
  paginateQuery,
} from '@aws-sdk/client-dynamodb';
import type {
  GetItemCommandInput,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { BaseProvider } from '../base/BaseProvider.js';
import type {
  DynamoDBGetMultipleOptions,
  DynamoDBGetMultipleOutput,
  DynamoDBGetOptions,
  DynamoDBGetOutput,
  DynamoDBProviderOptions,
} from '../types/DynamoDBProvider.js';

/**
 * ## Intro
 * The Parameters utility provides a DynamoDBProvider that allows to retrieve values from Amazon DynamoDB.
 *
 * ## Getting started
 *
 * This utility supports AWS SDK v3 for JavaScript only (`@aws-sdk/client-dynamodb` and `@aws-sdk/util-dynamodb`). This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * ## Basic usage
 *
 * Retrieve a value from DynamoDB:
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   tableName: 'my-table',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a value from DynamoDB
 *   const value = await tableProvider.get('my-value-key');
 * };
 * ```
 *
 * You can also retrieve multiple values at once:
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   tableName: 'my-table',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *  // Retrieve multiple values from DynamoDB
 *  const values = await tableProvider.getMultiple('my-values-path');
 * };
 * ```
 *
 * ## Advanced usage
 *
 * ### Caching
 *
 * By default, the provider will cache parameters retrieved in-memory for 5 seconds.
 * You can adjust how long values should be kept in cache by using the `maxAge` parameter.
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   tableName: 'my-table',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a value and cache it for 10 seconds
 *   const value = await tableProvider.get('my-value-key', { maxAge: 10 });
 *   // Retrieve multiple values and cache them for 20 seconds
 *   const values = await tableProvider.getMultiple('my-values-path', { maxAge: 20 });
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   tableName: 'my-table',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a value and skip cache
 *   const value = await tableProvider.get('my-value-key', { forceFetch: true });
 *   // Retrieve multiple values and skip cache
 *   const values = await tableProvider.getMultiple('my-values-path', { forceFetch: true });
 * };
 * ```
 *
 * ### Transformations
 *
 * For values stored as JSON you can use the transform argument for deserialization. This will return a JavaScript object instead of a string.
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   tableName: 'my-table',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a value and parse it as JSON
 *   const value = await tableProvider.get('my-value-key', { transform: 'json' });
 *   // Retrieve multiple values and parse them as JSON
 *   const values = await tableProvider.getMultiple('my-values-path', { transform: 'json' });
 * };
 * ```
 *
 * For values that are instead stored as base64-encoded binary data, you can use the transform argument set to `binary` for decoding. This will return a decoded string.
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   tableName: 'my-table',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a base64-encoded string and decode it
 *   const value = await tableProvider.get('my-value-key', { transform: 'binary' });
 *   // Retrieve multiple base64-encoded strings and decode them
 *   const values = await tableProvider.getMultiple('my-values-path', { transform: 'binary' });
 * };
 * ```
 *
 * When retrieving multiple values, you can also use the `transform` argument set to `auto` to let the provider automatically detect the type of transformation to apply.
 * The provider will use the suffix of the sort key (`sk`) to determine the transformation to apply. For example, if the sort key is `my-value-key.json`, the provider will
 * automatically parse the value as JSON. Likewise, if the sort key is `my-value-key.binary`, the provider will automatically decode the value as base64-encoded binary data.
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   tableName: 'my-table',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve multiple values and automatically detect the transformation to apply
 *   const values = await tableProvider.getMultiple('my-values-path', { transform: 'auto' });
 * };
 * ```
 *
 * ### Custom key names
 *
 * By default, the provider will use the following key names: `id` for the partition key, `sk` for the sort key, and `value` for the value.
 * You can adjust the key names by using the `keyAttr`, `sortAttr`, and `valueAttr` parameters.
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   tableName: 'my-table',
 *   keyAttr: 'key',
 *   sortAttr: 'sort',
 *   valueAttr: 'val',
 * });
 * ```
 *
 * ### Extra SDK options
 *
 * When retrieving values, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   tableName: 'my-table',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a value and pass extra options to the AWS SDK v3 for JavaScript client
 *   const value = await tableProvider.get('my-value-key', {
 *     sdkOptions: {
 *       ConsistentRead: true,
 *     },
 *   });
 * };
 * ```
 *
 * The objects accept the same options as respectively the [AWS SDK v3 for JavaScript PutItem command](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/putitemcommand.html) and the [AWS SDK v3 for JavaScript DynamoDB client Query command](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/querycommand.html).
 *
 * ### Customize AWS SDK v3 for JavaScript client
 *
 * By default, the provider will create a new DynamoDB client using the default configuration.
 *
 * You can customize the client by passing a custom configuration object to the provider.
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 *
 * const tableProvider = new DynamoDBProvider({
 *   clientConfig: { region: 'eu-west-1' },
 * });
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript DynamoDB client constructor](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/dynamodbclient.html).
 *
 * Otherwise, if you want to use a custom client altogether, you can pass it to the provider.
 *
 * @example
 * ```typescript
 * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
 * import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
 *
 * const client = new DynamoDBClient({ region: 'eu-west-1' });
 * const tableProvider = new DynamoDBProvider({
 *   awsSdkV3Client: client,
 * });
 * ```
 *
 * This object must be an instance of the [AWS SDK v3 for JavaScript DynamoDB client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/dynamodbclient.html).
 *
 * For more usage examples, see [our documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/).
 */
class DynamoDBProvider extends BaseProvider {
  public declare client: DynamoDBClient;
  protected keyAttr = 'id';
  protected sortAttr = 'sk';
  protected tableName: string;
  protected valueAttr = 'value';

  /**
   * It initializes the DynamoDBProvider class.
   *
   * @param {DynamoDBProviderOptions} config - The configuration object.
   */
  public constructor(config: DynamoDBProviderOptions) {
    super({
      awsSdkV3ClientPrototype: DynamoDBClient as new (
        config?: unknown
      ) => DynamoDBClient,
      ...config,
    });

    const { tableName, keyAttr, sortAttr, valueAttr } = config;
    this.tableName = tableName;
    if (keyAttr) this.keyAttr = keyAttr;
    if (sortAttr) this.sortAttr = sortAttr;
    if (valueAttr) this.valueAttr = valueAttr;
  }

  /**
   * Retrieve a value from Amazon DynamoDB.
   *
   * @example
   * ```typescript
   * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
   *
   * const tableProvider = new DynamoDBProvider({
   *   tableName: 'my-table',
   * });
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve a single value
   *   const value = await tableProvider.get('my-value-key');
   * };
   * ```
   *
   * You can customize the retrieval of the value by passing options to the function:
   * * `maxAge` - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * * `forceFetch` - Whether to always fetch a new value from the store regardless if already available in cache
   * * `transform` - Whether to transform the value before returning it. Supported values: `json`, `binary`
   * * `sdkOptions` - Extra options to pass to the AWS SDK v3 for JavaScript client
   *
   * For usage examples check {@link DynamoDBProvider}.
   *
   * @param {string} name - The name of the value to retrieve (i.e. the partition key)
   * @param {DynamoDBGetOptionsInterface} options - Options to configure the provider
   * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
   */
  public async get<
    ExplicitUserProvidedType = undefined,
    InferredFromOptionsType extends
      | DynamoDBGetOptions
      | undefined = DynamoDBGetOptions,
  >(
    name: string,
    options?: InferredFromOptionsType & DynamoDBGetOptions
  ): Promise<
    | DynamoDBGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>
    | undefined
  > {
    return super.get(name, options) as Promise<
      | DynamoDBGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>
      | undefined
    >;
  }

  /**
   * Retrieve multiple values from Amazon DynamoDB.
   *
   * @example
   * ```typescript
   * import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
   *
   * const tableProvider = new DynamoDBProvider({
   *   tableName: 'my-table',
   * });
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve multiple values
   *   const values = await tableProvider.getMultiple('my-values-path');
   * };
   * ```
   *
   * You can customize the retrieval of the values by passing options to the function:
   * * `maxAge` - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * * `forceFetch` - Whether to always fetch a new value from the store regardless if already available in cache
   * * `transform` - Whether to transform the value before returning it. Supported values: `json`, `binary`
   * * `sdkOptions` - Extra options to pass to the AWS SDK v3 for JavaScript client
   * * `throwOnTransformError` - Whether to throw an error if the transform fails (default: `true`)
   *
   * For usage examples check {@link DynamoDBProvider}.
   *
   * @param {string} path - The path of the values to retrieve (i.e. the partition key)
   * @param {DynamoDBGetMultipleOptions} options - Options to configure the provider
   * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
   */
  public async getMultiple<
    ExplicitUserProvidedType = undefined,
    InferredFromOptionsType extends
      | DynamoDBGetMultipleOptions
      | undefined = DynamoDBGetMultipleOptions,
  >(
    path: string,
    options?: InferredFromOptionsType & DynamoDBGetMultipleOptions
  ): Promise<
    | DynamoDBGetMultipleOutput<
        ExplicitUserProvidedType,
        InferredFromOptionsType
      >
    | undefined
  > {
    return super.getMultiple(path, options) as Promise<
      | DynamoDBGetMultipleOutput<
          ExplicitUserProvidedType,
          InferredFromOptionsType
        >
      | undefined
    >;
  }

  /**
   * Retrieve an item from Amazon DynamoDB.
   *
   * @param {string} name - Key of the item to retrieve (i.e. the partition key)
   * @param {DynamoDBGetOptions} options - Options to customize the retrieval
   */
  protected async _get(
    name: string,
    options?: DynamoDBGetOptions
  ): Promise<JSONValue | undefined> {
    const sdkOptions: GetItemCommandInput = {
      ...(options?.sdkOptions || {}),
      TableName: this.tableName,
      Key: marshall({ [this.keyAttr]: name }),
      ProjectionExpression: '#value',
      ExpressionAttributeNames: {
        '#value': this.valueAttr,
      },
    };
    const result = await this.client.send(new GetItemCommand(sdkOptions));

    return result.Item ? unmarshall(result.Item)[this.valueAttr] : undefined;
  }

  /**
   * Retrieve multiple items from Amazon DynamoDB.
   *
   * @param {string} path - The path of the values to retrieve (i.e. the partition key)
   * @param {DynamoDBGetMultipleOptions} options - Options to customize the retrieval
   */
  protected async _getMultiple(
    path: string,
    options?: DynamoDBGetMultipleOptions
  ): Promise<Record<string, JSONValue>> {
    const sdkOptions: QueryCommandInput = {
      ...(options?.sdkOptions || {}),
      TableName: this.tableName,
      KeyConditionExpression: '#key = :key',
      ExpressionAttributeValues: marshall({ ':key': path }),
      ExpressionAttributeNames: {
        '#key': this.keyAttr,
        '#sk': this.sortAttr,
        '#value': this.valueAttr,
      },
      ProjectionExpression: '#sk, #value',
    };
    const paginationOptions: DynamoDBPaginationConfiguration = {
      client: this.client,
      pageSize: options?.sdkOptions?.Limit,
    };

    const parameters: Record<string, JSONValue> = {};
    for await (const page of paginateQuery(paginationOptions, sdkOptions)) {
      for (const item of page.Items || []) {
        const unmarshalledItem = unmarshall(item);
        parameters[unmarshalledItem[this.sortAttr]] =
          unmarshalledItem[this.valueAttr];
      }
    }

    return parameters;
  }
}

export { DynamoDBProvider };
