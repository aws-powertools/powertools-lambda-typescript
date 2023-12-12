import { z, ZodSchema } from 'zod';

/**
 * Abstract function to parse the content of the envelope using provided schema.
 * Both inputs are provided as unknown by the user.
 * We expect the data to be either string that can be parsed to json or object.
 * @internal
 * @param data data to parse
 * @param schema schema
 */
export const parse = <T extends ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T>[] => {
  if (typeof data === 'string') {
    return schema.parse(JSON.parse(data));
  } else if (typeof data === 'object') {
    return schema.parse(data);
  } else
    throw new Error(
      `Invalid data type for envelope. Expected string or object, got ${typeof data}`
    );
};
