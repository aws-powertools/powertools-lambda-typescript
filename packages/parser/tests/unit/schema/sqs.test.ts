/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { SqsSchema } from '../../../src/schemas/sqs';
import { loadExampleEvent } from './utils';

describe('SQS ', () => {
  const sqsEvent = loadExampleEvent('sqsEvent.json');
  it('should parse sqs event', () => {
    expect(SqsSchema.parse(sqsEvent)).toEqual(sqsEvent);
  });
});
