import { getStringFromEnv } from '#helpers/utils';

// Get the DynamoDB table name from environment variables
const itemsTableName = getStringFromEnv('TABLE_NAME');

export { itemsTableName };
