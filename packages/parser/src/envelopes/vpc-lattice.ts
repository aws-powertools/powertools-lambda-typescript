import { z, type ZodSchema } from 'zod';
import { Envelope } from './envelope.js';
import { VpcLatticeSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';

/**
 * Amazon VPC Lattice envelope to extract data within body key
 */

export class VpcLatticeEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    const parsedEnvelope = VpcLatticeSchema.parse(data);

    return super.parse(parsedEnvelope.body, schema);
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    const parsedEnvelope = VpcLatticeSchema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        ...parsedEnvelope,
        originalEvent: data,
      };
    }

    const parsedBody = super.safeParse(parsedEnvelope.data.body, schema);

    if (!parsedBody.success) {
      return {
        ...parsedBody,
        originalEvent: data,
      };
    }

    return parsedBody;
  }
}
