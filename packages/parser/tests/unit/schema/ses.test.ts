/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { loadExampleEvent } from './utils.js';
import { SesSchema } from '../../../src/schemas/ses.js';

describe('Schema:', () => {
  const sesEvent = loadExampleEvent('sesEvent.json');
  it('SES should parse ses event', () => {
    expect(SesSchema.parse(sesEvent)).toEqual(sesEvent);
  });
});
