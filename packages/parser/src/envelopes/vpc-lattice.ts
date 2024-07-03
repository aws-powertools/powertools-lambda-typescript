import { z, type ZodSchema } from 'zod';
import { Envelope } from './envelope.js';
import { VpcLatticeSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { ParseError } from '../errors.js';

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
        success: false,
        error: new ParseError('Failed to parse VpcLattice envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const parsedBody = super.safeParse(parsedEnvelope.data.body, schema);

    if (!parsedBody.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse VpcLattice envelope body', {
          cause: parsedBody.error,
        }),
        originalEvent: data,
      };
    }

    return parsedBody;
  }
}
