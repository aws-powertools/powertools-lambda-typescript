/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { SqsSchema } from '../../../src/schemas/sqs.js';
import { TestEvents } from './utils.js';

describe('SQS ', () => {
  it('should parse sqs event', () => {
    const sqsEvent = TestEvents.sqsEvent;
    expect(SqsSchema.parse(sqsEvent)).toEqual(sqsEvent);
  });
});
