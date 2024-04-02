/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { SesSchema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('Schema:', () => {
  it('SES should parse ses event', () => {
    const sesEvent = TestEvents.sesEvent;
    expect(SesSchema.parse(sesEvent)).toEqual(sesEvent);
  });
});
