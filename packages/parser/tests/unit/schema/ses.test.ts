/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { SesSchema } from '../../../src/schemas/ses';
import sesEvent from '../../events/sesEvent.json';

describe('Schema:', () => {
  it('SES should parse ses event', () => {
    expect(SesSchema.parse(sesEvent)).toEqual(sesEvent);
  });
});
