import { Envelope } from './Envelope.js';
import { z, ZodSchema } from 'zod';
import { VpcLatticeV2Schema } from '../schemas/vpc-latticev2.js';

/**
 * Amazon VPC Lattice envelope to extract data within body key
 */
export class VpcLatticeV2Envelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = VpcLatticeV2Schema.parse(data);

    return this._parse(parsedEnvelope.body, schema);
  }
}
