import { type ZodSchema, z } from 'zod';

/**
 * A helper function to parse a JSON string and validate it against a schema.
 * Use it for built-in schemas like `AlbSchema`, `ApiGatewaySchema`, etc. to extend them with your customer schema.
 *
 * @example
 * ```typescript
 * import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
 * import { AlbSchema } from '@aws-lambda-powertools/parser/schemas';
 * import { z } from 'zod';
 *
 * const customSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 * });
 *
 * const extendedSchema = AlbSchema.extend({
 *   body: JSONStringified(customSchema), // (1)!
 * });
 * ```
 *
 * @param schema - The schema to validate the JSON string against
 */
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
