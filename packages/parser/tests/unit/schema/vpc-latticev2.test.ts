/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { VpcLatticeV2Schema } from '../../../src/schemas/';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

describe('VpcLatticeV2 ', () => {
  it('should parse VpcLatticeV2 event', () => {
    const vpcLatticeV2Event = TestEvents.vpcLatticeV2Event;
    const parsed = VpcLatticeV2Schema.parse(vpcLatticeV2Event);
    expect(parsed).toEqual(vpcLatticeV2Event);
  });

  it('should parse VpcLatticeV2PathTrailingSlash event', () => {
    const vpcLatticeEventV2PathTrailingSlash =
      TestEvents.vpcLatticeEventV2PathTrailingSlash;
    const parsed = VpcLatticeV2Schema.parse(vpcLatticeEventV2PathTrailingSlash);
    expect(parsed).toEqual(vpcLatticeEventV2PathTrailingSlash);
  });

  it('should detect missing properties in schema for vpc lattice event v2', () => {
    const vpcLatticeV2Event = TestEvents.vpcLatticeV2Event;

    const strictSchema = makeSchemaStrictForTesting(VpcLatticeV2Schema);

    expect(() => strictSchema.parse(vpcLatticeV2Event)).not.toThrow();
  });
});
