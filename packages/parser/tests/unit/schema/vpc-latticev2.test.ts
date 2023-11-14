/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { VpcLatticeV2Schema } from '../../../src/schemas/vpc-latticev2';
import vpcLatticeV2Event from '../../events/vpcLatticeV2Event.json';
import vpcLatticeEventV2PathTrailingSlash from '../../events/vpcLatticeEventV2PathTrailingSlash.json';

describe('VpcLatticeV2 ', () => {
  it('should parse VpcLatticeV2 event', () => {
    const parsed = VpcLatticeV2Schema.parse(vpcLatticeV2Event);
    expect(parsed).toEqual(vpcLatticeV2Event);
  });

  it('should parse VpcLatticeV2PathTrailingSlash event', () => {
    const parsed = VpcLatticeV2Schema.parse(vpcLatticeEventV2PathTrailingSlash);
    expect(parsed).toEqual(vpcLatticeEventV2PathTrailingSlash);
  });
});
