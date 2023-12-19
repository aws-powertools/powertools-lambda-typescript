import { parse } from './envelope.js';
import { z, ZodSchema } from 'zod';
import { VpcLatticeSchema } from '../schemas/vpc-lattice.js';

/**
 * Amazon VPC Lattice envelope to extract data within body key
 */
export const vpcLatticeEnvelope = <T extends ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> => {
  const parsedEnvelope = VpcLatticeSchema.parse(data);

  return parse(parsedEnvelope.body, schema);
};
