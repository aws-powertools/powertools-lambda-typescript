import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { type ZodTypeAny, z } from 'zod';

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

export { DynamoDBMarshalled };
