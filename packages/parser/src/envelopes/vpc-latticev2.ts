import { parse } from './envelope.js';
import { z, ZodSchema } from 'zod';
import { VpcLatticeV2Schema } from '../schemas/vpc-latticev2.js';

/**
 * Amazon VPC Lattice envelope to extract data within body key
 */
export const vpcLatticeV2Envelope = <T extends ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> => {
  const parsedEnvelope = VpcLatticeV2Schema.parse(data);

  return parse(parsedEnvelope.body, schema);
};
