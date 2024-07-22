import { randomUUID } from 'node:crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '#clients/dynamodb';
import { itemsTableName } from '#constants';
import type { DebugLogger } from '#types';

/**
 * Put an item in the DynamoDB table.
 *
 * When the item is put in the table, the item's ID and name are returned.
 *
 * @param name The name of the item to put in the DynamoDB table
 * @param logger A logger instance
 */
const putItemInDynamoDB = async (
  name: string,
  logger: DebugLogger
): Promise<{ id: string; name: string }> => {
  const item = {
    id: randomUUID(),
    name,
  };

  const response = await docClient.send(
    new PutCommand({
      TableName: itemsTableName,
      Item: item,
    })
  );

  logger.debug('ddb response', {
    response,
  });

  return item;
};

export { putItemInDynamoDB };
