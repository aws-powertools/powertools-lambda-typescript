import { z, ZodSchema } from 'zod';

export abstract class Envelope {
  protected static _parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    if (!schema) throw new Error('Schema is required');
    if (!data) return data;

    return schema.parse(data);
  }

  protected static parse<T extends ZodSchema>(
    _data: unknown,
    _schema: T
  ): z.infer<T> {
    throw new Error('Not implemented');
  }
}
