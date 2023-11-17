/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { SnsSchema } from '../../../src/schemas/sns';
import { loadExampleEvent } from './utils';

describe('Schema:', () => {
  const snsEvent = loadExampleEvent('snsEvent.json');
  it('SNS should parse sns event', () => {
    expect(SnsSchema.parse(snsEvent)).toEqual(snsEvent);
  });
});
