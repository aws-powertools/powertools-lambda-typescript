import { Envelope } from './Envelope.js';
import { z, ZodSchema } from 'zod';
import { VpcLatticeSchema } from '../schemas/vpc-lattice.js';

/**
 * Amazon VPC Lattice envelope to extract data within body key
 */
export class VpcLatticeEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = VpcLatticeSchema.parse(data);

    return this._parse(parsedEnvelope.body, schema);
  }
}
