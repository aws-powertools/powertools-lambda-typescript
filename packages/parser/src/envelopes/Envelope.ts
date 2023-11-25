import { z, ZodSchema } from 'zod';

/**
 * Abstract class for envelopes.
 */
export abstract class Envelope {
  protected constructor() {}

  public abstract parse<T extends ZodSchema>(
    data: unknown,
    _schema: z.ZodSchema<T>
  ): z.infer<T>;

  protected _parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T>[] {
    if (typeof data !== 'object') {
      throw new Error('Data must be an object');
    }

    return schema.parse(data);
  }
}
