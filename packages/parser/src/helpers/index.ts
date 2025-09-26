import { gunzipSync } from 'node:zlib';
import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';
import { type ZodType, z } from 'zod';

const decoder = new TextDecoder();

const decompress = (data: string): string => {
  try {
    return JSON.parse(gunzipSync(fromBase64(data, 'base64')).toString('utf8'));
  } catch {
    return data;
  }
};

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
const JSONStringified = <T extends ZodType>(schema: T) =>
  z
    .string()
    .transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (error) {
        ctx.addIssue({
          code: 'custom',
          message: `Invalid JSON - ${(error as Error).message}`,
          fatal: true,
        });
      }
    })
    .pipe(schema);

/**
 * A helper function to decode a Base64 string and validate it against a schema.
 *
 *
 * Use it for built-in schemas like `KinesisDataStreamRecordPayload` that have fields that are base64 encoded
 * and extend them with your custom schema.
 *
 * For example, if you have an event with a base64 encoded body similar to the following:
 *
 * ```json
 * {
 *   // ... other fields
 *   "data": "e3Rlc3Q6ICJ0ZXN0In0=",
 * }
 * ```
 *
 * You can extend any built-in schema with your custom schema using the `Base64Encoded` helper function.
 *
 * @example
 * ```typescript
 * import { Base64Encoded } from '@aws-lambda-powertools/parser/helpers';
 * import { KinesisDataStreamRecordPayload } from '@aws-lambda-powertools/parser/schemas/kinesis';
 * import { z } from 'zod';
 *
 * const extendedSchema = KinesisDataStreamRecordPayload.extend({
 *   data: Base64Encoded(z.object({
 *     test: z.string(),
 *   }))
 * });
 * type _ExtendedKinesisDataStream = z.infer<typeof extendedSchema>;
 * ```
 *
 * @param schema - The schema to validate the Base 64 decoded value against
 */
const Base64Encoded = <T extends ZodType>(schema: T) =>
  z
    .string()
    .transform((data) => {
      const decompressed = decompress(data);
      const decoded = decoder.decode(fromBase64(data, 'base64'));
      try {
        // If data was not compressed, try to parse it as JSON otherwise it must be string
        return decompressed === data ? JSON.parse(decoded) : decompressed;
      } catch {
        return decoded;
      }
    })
    .pipe(schema);

export { JSONStringified, Base64Encoded };
