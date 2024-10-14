import { describe, expect, it } from 'vitest';
import { VpcLatticeSchema } from '../../../src/schemas/vpc-lattice.js';
import type { VpcLatticeEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: VpcLattice ', () => {
  const baseEvent = getTestEvent<VpcLatticeEvent>({
    eventsPath: 'vpc-lattice',
    filename: 'base',
  });

  it('parses a VpcLattice event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const parsedEvent = VpcLatticeSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('throws if event is not a VpcLattice event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => VpcLatticeSchema.parse(event)).toThrow();
  });
});
