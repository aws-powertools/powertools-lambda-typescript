import type { ZodType } from 'zod';
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
  parse<T>(data: unknown, schema: ZodType<T>): T {
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

  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T> {
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
