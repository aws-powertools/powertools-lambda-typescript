/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { SesSchema } from '../../../src/schemas/ses';
import { loadExampleEvent } from './utils';

describe('Schema:', () => {
  const sesEvent = loadExampleEvent('sesEvent.json');
  it('SES should parse ses event', () => {
    expect(SesSchema.parse(sesEvent)).toEqual(sesEvent);
  });
});
