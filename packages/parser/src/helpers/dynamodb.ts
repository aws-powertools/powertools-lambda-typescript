import { unmarshallDynamoDB } from '@aws-lambda-powertools/commons/utils/unmarshallDynamoDB';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { type ZodType, z } from 'zod';

/**
 * A helper function to unmarshall DynamoDB stream events and validate them against a schema.
 *
 * @example
 * ```typescript
 * const mySchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 * });
 * const eventSchema = DynamoDBStreamSchema.extend({
 *   Records: z.array(
 *     DynamoDBStreamRecord.extend({
 *       dynamodb: z.object({
 *         NewImage: DynamoDBMarshalled(mySchema).optional(),
 *       }),
 *     })
 *   ),
 * });
 * type eventSchema = z.infer<typeof extendedSchema>;
 * ```
 * For example, if you have a DynamoDB stream event like the following:
 *
 * ```json
 * {
 *   "Records": [
 *     {
 *       "dynamodb": {
 *         "NewImage": {
 *           "id": {
 *             "S": "12345"
 *           },
 *           "name": {
 *             "S": "John Doe"
 *           }
 *         }
 *       }
 *     }
 *   ]
 * }
 * ```
 * Resulting in:
 *
 * ```json
 * {
 *   "Records": [
 *     {
 *       "dynamodb": {
 *         "NewImage": {
 *           "id": "12345",
 *           "name": "John Doe"
 *         }
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @param schema - The schema to validate the JSON string against
 */
const DynamoDBMarshalled = <T>(schema: ZodType<T>) =>
  z
    .union([
      z.custom<AttributeValue>(),
      z.record(z.string(), z.custom<AttributeValue>()),
    ])
    .transform((str, ctx) => {
      try {
        return unmarshallDynamoDB(str);
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'Could not unmarshall DynamoDB stream record',
          fatal: true,
        });

        return z.NEVER;
      }
    })
    .pipe(schema);

export { DynamoDBMarshalled };
