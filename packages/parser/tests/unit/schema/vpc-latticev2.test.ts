import { describe, expect, it } from 'vitest';
import { VpcLatticeV2Schema } from '../../../src/schemas/vpc-latticev2.js';
import type { VpcLatticeEventV2 } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: VpcLatticeV2 ', () => {
  const baseEvent = getTestEvent<VpcLatticeEventV2>({
    eventsPath: 'vpc-lattice',
    filename: 'base-v2',
  });

  it('parses a VpcLatticeV2 event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const parsedEvent = VpcLatticeV2Schema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('throws if event is not a VpcLatticeV2 event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => VpcLatticeV2Schema.parse(event)).toThrow();
  });
});
