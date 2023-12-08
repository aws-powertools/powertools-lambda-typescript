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
    if (typeof data === 'string') {
      return schema.parse(JSON.parse(data));
    } else if (typeof data === 'object') {
      return schema.parse(data);
    } else
      throw new Error(
        `Invalid data type for envelope. Expected string or object, got ${typeof data}`
      );
  }
}
