import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { VpcLatticeSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope, envelopeDiscriminator } from './envelope.js';

/**
 * Amazon VPC Lattice envelope to extract data within body key
 */

export const VpcLatticeEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'object' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = VpcLatticeSchema.parse(data);

    return Envelope.parse(parsedEnvelope.body, schema);
  },

  safeParse<T extends ZodSchema>(data: unknown, schema: T): ParsedResult<unknown, z.infer<T>> {
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

    const parsedBody = Envelope.safeParse(parsedEnvelope.data.body, schema);

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
  },
};
