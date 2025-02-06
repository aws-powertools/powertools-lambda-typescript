import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { VpcLatticeV2Schema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * Amazon VPC Lattice envelope to extract data within body key
 */
export const VpcLatticeV2Envelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'object' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    try {
      return VpcLatticeV2Schema.extend({
        body: schema,
      }).parse(data).body;
    } catch (error) {
      throw new ParseError('Failed to parse VPC Lattice v2 body', {
        cause: error as Error,
      });
    }
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>> {
    const result = VpcLatticeV2Schema.extend({
      body: schema,
    }).safeParse(data);

    if (!result.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse VPC Lattice v2 body', {
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
