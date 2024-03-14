// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

if (!tableName) {
  throw new Error('SAMPLE_TABLE environment variable is not set');
}

const uuidApiUrl = 'https://httpbin.org/uuid';

export { tableName, uuidApiUrl };
