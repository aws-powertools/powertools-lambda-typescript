import { describe, expect, it } from 'vitest';
import { VpcLatticeV2Schema } from '../../../src/schemas/vpc-latticev2.js';
import type { VpcLatticeEventV2 } from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Schema: VPC Lattice v2', () => {
  const baseEvent = getTestEvent<VpcLatticeEventV2>({
    eventsPath: 'vpc-lattice-v2',
    filename: 'base',
  });

  it('throws when the event is invalid', () => {
    // Prepare
    const event = omit(['version', 'path'], structuredClone(baseEvent));

    // Act & Assess
    expect(() => VpcLatticeV2Schema.parse(event)).toThrow();
  });

  it('parses a VPC Lattice v2 event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = VpcLatticeV2Schema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });
});
