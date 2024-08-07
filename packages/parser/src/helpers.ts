import { type ZodSchema, z } from 'zod';

const JSONStringified = (schema: ZodSchema) =>
  z
    .string()
    .transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (err) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid JSON',
        });
      }
    })
    .pipe(schema);

export { JSONStringified };
