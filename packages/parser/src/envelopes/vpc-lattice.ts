import type { ZodType, z } from 'zod';
import { ParseError } from '../errors.js';
import { VpcLatticeSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * Amazon VPC Lattice envelope to extract data within body key
 */
export const VpcLatticeEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'object' as const,
  parse<T>(data: unknown, schema: ZodType<T>): z.infer<ZodType<T>> {
    try {
      return VpcLatticeSchema.extend({
        body: schema,
      }).parse(data).body;
    } catch (error) {
      throw new ParseError('Failed to parse VPC Lattice body', {
        cause: error as Error,
      });
    }
  },

  safeParse<T>(
    data: unknown,
    schema: ZodType<T>
  ): ParsedResult<unknown, z.infer<ZodType<T>>> {
    const result = VpcLatticeSchema.extend({
      body: schema,
    }).safeParse(data);

    if (!result.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse VPC Lattice body', {
          cause: result.error,
        }),
        originalEvent: data,
      };
    }

    return {
      success: true,
      data: result.data.body,
    };
  },
};
