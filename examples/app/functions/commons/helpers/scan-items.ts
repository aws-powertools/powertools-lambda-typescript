import { ScanCommand, type ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import { docClient } from '#clients/dynamodb';
import { itemsTableName } from '#constants';
import type { DebugLogger } from '#types';

/**
 * Scan the DynamoDB table and return all items.
 *
 * @note this function is purposefully not paginated to keep the example simple
 *
 * @param logger A logger instance
 */
const scanItemsDynamoDB = async (
  logger: DebugLogger
): Promise<ScanCommandOutput['Items']> => {
  const response = await docClient.send(
    new ScanCommand({
      TableName: itemsTableName,
    })
  );

  logger.debug('ddb response', {
    response,
  });

  return response.Items;
};

export { scanItemsDynamoDB };
