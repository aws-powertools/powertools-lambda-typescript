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

  protected async _get(name: string, options?: DynamoDBGetOptionsInterface): Promise<string | undefined> {
    const sdkOptions: GetItemCommandInput = {
      TableName: this.tableName,
      Key: marshall({ [this.keyAttr]: name }),
    };
    if (options && options.hasOwnProperty('sdkOptions')) {
      // Explicit arguments passed to the constructor will take precedence over ones passed to the method
      delete options.sdkOptions?.Key;
      // TODO: check if TableName is overridable
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
    };
    const paginationOptions: PaginationConfiguration = {
      client: this.client,
    };
    if (options && options.hasOwnProperty('sdkOptions')) {
      // Explicit arguments passed to the constructor will take precedence over ones passed to the method
      delete options.sdkOptions?.KeyConditionExpression;
      delete options.sdkOptions?.ExpressionAttributeValues;
      if (options.sdkOptions?.hasOwnProperty('Limit')) {
        paginationOptions.pageSize = options.sdkOptions.Limit;
      }
      Object.assign(sdkOptions, options.sdkOptions);
    }

    const parameters: Record<string, string | undefined> = {};
    for await (const page of paginateQuery(paginationOptions, sdkOptions)) {
      for (const item of page.Items || []) {
        const unmarshalledItem = unmarshall(item);
        parameters[unmarshalledItem[this.keyAttr]] = unmarshalledItem[this.valueAttr];
      }
    }

    return parameters;
  }
}

export {
  DynamoDBProvider,
};