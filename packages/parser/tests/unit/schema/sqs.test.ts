/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { loadExampleEvent } from './utils.js';
import { SqsSchema } from '../../../src/schemas/sqs.js';

describe('SQS ', () => {
  const sqsEvent = loadExampleEvent('sqsEvent.json');
  it('should parse sqs event', () => {
    expect(SqsSchema.parse(sqsEvent)).toEqual(sqsEvent);
  });
});
