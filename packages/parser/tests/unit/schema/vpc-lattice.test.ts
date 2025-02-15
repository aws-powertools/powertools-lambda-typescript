import { describe, expect, it } from 'vitest';
import { VpcLatticeSchema } from '../../../src/schemas/vpc-lattice.js';
import type { VpcLatticeEvent } from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Schema: VPC Lattice', () => {
  const baseEvent = getTestEvent<VpcLatticeEvent>({
    eventsPath: 'vpc-lattice',
    filename: 'base',
  });

  it('throws when the event is invalid', () => {
    // Prepare
    const event = omit(['query_string_parameters'], structuredClone(baseEvent));

    // Act & Assess
    expect(() => VpcLatticeSchema.parse(event)).toThrow();
  });

  it('parses a VPC Lattice event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = VpcLatticeSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });
});
