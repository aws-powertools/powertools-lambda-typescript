/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { VpcLatticeV2Schema } from '../../../src/schemas/vpc-latticev2';
import { loadExampleEvent } from './utils';

describe('VpcLatticeV2 ', () => {
  it('should parse VpcLatticeV2 event', () => {
    const vpcLatticeV2Event = loadExampleEvent('vpcLatticeV2Event.json');
    const parsed = VpcLatticeV2Schema.parse(vpcLatticeV2Event);
    expect(parsed).toEqual(vpcLatticeV2Event);
  });

  it('should parse VpcLatticeV2PathTrailingSlash event', () => {
    const vpcLatticeEventV2PathTrailingSlash = loadExampleEvent(
      'vpcLatticeEventV2PathTrailingSlash.json'
    );
    const parsed = VpcLatticeV2Schema.parse(vpcLatticeEventV2PathTrailingSlash);
    expect(parsed).toEqual(vpcLatticeEventV2PathTrailingSlash);
  });
});
