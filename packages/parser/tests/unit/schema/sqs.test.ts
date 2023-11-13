/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { SqsSchema } from '../../../src/schemas/sqs';
import sqsEvent from '../../events/sqsEvent.json';

describe('SQS ', () => {
  it('should parse sqs event', () => {
    SqsSchema.parse(sqsEvent);
  });
});
