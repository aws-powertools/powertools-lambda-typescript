import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { type ZodTypeAny, z } from 'zod';
/**
 * @typedef {import('../schemas/alb').AlbSchema} AlbSchema
 */

/**
 * A helper function to parse a JSON string and validate it against a schema.
 *
 * Use it for built-in schemas like `AlbSchema`, `ApiGatewaySchema`, etc. that have some fields that are JSON stringified
 * and extend them with your custom schema.
 *
 * For example, if you have an event with a JSON stringified body similar to the following:
 *
 * ```json
 * {
 *   // ... other fields
 *   "body": "{\"name\": \"John\", \"age\": 30}",
 *   "isBase64Encoded": false,
 * }
 * ```
 *
 * You can extend any built-in schema with your custom schema using the `JSONStringified` helper function.
 *
 * @example
 * ```typescript
 * import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
 * import { AlbSchema } from '@aws-lambda-powertools/parser/schemas/alb';
 * import { z } from 'zod';
 *
 * const customSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 * });
 *
 * const extendedSchema = AlbSchema.extend({
 *   body: JSONStringified(customSchema),
 * });
 *
 * type ExtendedAlbEvent = z.infer<typeof extendedSchema>;
 * ```
 *
 * @param schema - The schema to validate the JSON string against
 */
const JSONStringified = <T extends ZodTypeAny>(schema: T) =>
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

const DynamoDBMarshalled = <T extends ZodTypeAny>(schema: T) =>
  z
    .record(z.string(), z.custom<AttributeValue>())
    .transform((str, ctx) => {
      try {
        return unmarshall(str);
      } catch (err) {
        ctx.addIssue({
          code: 'custom',
          message: 'Could not unmarshall DynamoDB stream record',
          fatal: true,
        });

        return z.NEVER;
      }
    })
    .pipe(schema);

export { JSONStringified, DynamoDBMarshalled };
