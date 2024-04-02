/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { SnsSchema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('Schema:', () => {
  it('SNS should parse sns event', () => {
    const snsEvent = TestEvents.snsEvent;
    expect(SnsSchema.parse(snsEvent)).toEqual(snsEvent);
  });
});
