import { GetCommand, type GetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { docClient } from '#clients/dynamodb';
import { itemsTableName } from '#constants';
import type { DebugLogger } from '#types';

/**
 * Fetch an item from the DynamoDB table.
 *
 * @param id The ID of the item to fetch from the DynamoDB table
 * @param logger A logger instance
 */
const getItemDynamoDB = async (
  id: string,
  logger: DebugLogger
): Promise<GetCommandOutput['Item']> => {
  const response = await docClient.send(
    new GetCommand({
      TableName: itemsTableName,
      Key: {
        id,
      },
    })
  );

  logger.debug('ddb response', {
    response,
  });

  return response.Item;
};

export { getItemDynamoDB };
