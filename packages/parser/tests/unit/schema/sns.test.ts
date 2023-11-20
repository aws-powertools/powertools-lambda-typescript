/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { loadExampleEvent } from './utils.js';
import { SnsSchema } from '../../../src/schemas/sns.js';

describe('Schema:', () => {
  const snsEvent = loadExampleEvent('snsEvent.json');
  it('SNS should parse sns event', () => {
    expect(SnsSchema.parse(snsEvent)).toEqual(snsEvent);
  });
});
