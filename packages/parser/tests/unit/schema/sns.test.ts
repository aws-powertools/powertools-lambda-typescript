/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { SnsSchema } from '../../../src/schemas/sns';
import snsEvent from '../../events/snsEvent.json';

describe('Schema:', () => {
  it('SNS should parse sns event', () => {
    expect(SnsSchema.parse(snsEvent)).toEqual(snsEvent);
  });
});
