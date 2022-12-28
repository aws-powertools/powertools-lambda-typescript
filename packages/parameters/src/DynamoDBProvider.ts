import { BaseProvider } from './BaseProvider';
import { DynamoDBClient, GetItemCommand, paginateQuery } from '@aws-sdk/client-dynamodb';
import type {
  DynamoDBProviderOptions,
  DynamoDBGetOptionsInterface,
  DynamoDBGetMultipleOptionsInterface
} from './types/DynamoDBProvider';
import type { GetItemCommandInput, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { PaginationConfiguration } from '@aws-sdk/types';

class DynamoDBProvider extends BaseProvider {
  public client: DynamoDBClient;
  protected keyAttr: string = 'id';
  protected sortAttr: string = 'sk';
  protected tableName: string;
  protected valueAttr: string = 'value';

  public constructor(config: DynamoDBProviderOptions) {
    super();

    const clientConfig = config.clientConfig || {};
    this.client = new DynamoDBClient(clientConfig);
    this.tableName = config.tableName;
    if (config.keyAttr) this.keyAttr = config.keyAttr;
    if (config.sortAttr) this.sortAttr = config.sortAttr;
    if (config.valueAttr) this.valueAttr = config.valueAttr;
  }

  public async get(name: string, options?: DynamoDBGetOptionsInterface): Promise<undefined | string | Record<string, unknown>> {
    return super.get(name, options);
  }

  public async getMultiple(path: string, options?: DynamoDBGetMultipleOptionsInterface): Promise<undefined | Record<string, unknown>> {
    return super.getMultiple(path, options);
  }

  protected async _get(name: string, options?: DynamoDBGetOptionsInterface): Promise<string | undefined> {
    const sdkOptions: GetItemCommandInput = {
      TableName: this.tableName,
      Key: marshall({ [this.keyAttr]: name }),
      ProjectionExpression: this.valueAttr,
    };
    if (options && options.sdkOptions) {
      this.removeNonOverridableOptions(options.sdkOptions as GetItemCommandInput);
      Object.assign(sdkOptions, options.sdkOptions);
    }
    const result = await this.client.send(new GetItemCommand(sdkOptions));

    return result.Item ? unmarshall(result.Item)[this.valueAttr] : undefined;
  }

  protected async _getMultiple(path: string, options?: DynamoDBGetMultipleOptionsInterface): Promise<Record<string, string | undefined>> {
    const sdkOptions: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: `${this.keyAttr} = :key`,
      ExpressionAttributeValues: marshall({ ':key': path }),
      ProjectionExpression: `${this.sortAttr}, ${this.valueAttr}`,
    };
    const paginationOptions: PaginationConfiguration = {
      client: this.client,
    };
    if (options && options.sdkOptions) {
      this.removeNonOverridableOptions(options.sdkOptions as QueryCommandInput);
      if (options.sdkOptions?.hasOwnProperty('Limit')) {
        paginationOptions.pageSize = options.sdkOptions.Limit;
      }
      Object.assign(sdkOptions, options.sdkOptions);
    }

    const parameters: Record<string, string | undefined> = {};
    for await (const page of paginateQuery(paginationOptions, sdkOptions)) {
      for (const item of page.Items || []) {
        const unmarshalledItem = unmarshall(item);
        parameters[unmarshalledItem[this.sortAttr]] = unmarshalledItem[this.valueAttr];
      }
    }

    return parameters;
  }

  /**
   * This method is used as a type guard to narrow down the type of the options object.
   */
  protected isGetItemCommandInput(options: GetItemCommandInput | QueryCommandInput): options is GetItemCommandInput {
    return (options as GetItemCommandInput).Key !== undefined;
  }

  /**
   * Explicit arguments passed to the constructor will take precedence over ones passed to the method.
   * For users who consume the library with TypeScript, this will be enforced by the type system. However,
   * for JavaScript users, we need to manually delete the properties that are not allowed to be overridden.
   */
  protected removeNonOverridableOptions(options: GetItemCommandInput | QueryCommandInput): void {
    if (options.hasOwnProperty('TableName')) {
      delete options.TableName;
    }
    if (options.hasOwnProperty('ProjectionExpression')) {
      delete options.ProjectionExpression;
    }
    if (options.hasOwnProperty('Key') && this.isGetItemCommandInput(options)) {
      delete options.Key;
    } else if (options.hasOwnProperty('KeyConditionExpression') && !this.isGetItemCommandInput(options)) {
      if (options.hasOwnProperty('KeyConditionExpression')) {
        delete options.KeyConditionExpression;
      }
      if (options.hasOwnProperty('ExpressionAttributeValues')) {
        delete options.ExpressionAttributeValues;
      }
    }
  }
}

export {
  DynamoDBProvider,
};