/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { DynamoDBStreamSchema } from '../../../src/schemas/dynamodb';
import dynamodbStreamEvent from '../../events/dynamoStreamEvent.json';

describe('DynamoDB ', () => {
  it('should parse a stream of records', () => {
    DynamoDBStreamSchema.parse(dynamodbStreamEvent);
  });
});
