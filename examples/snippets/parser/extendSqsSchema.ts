import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
import {
  SqsRecordSchema,
  SqsSchema,
} from '@aws-lambda-powertools/parser/schemas/sqs';
import { z } from 'zod';

const customSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const extendedSchema = SqsSchema.extend({
  Records: z.array(
    SqsRecordSchema.extend({
      body: JSONStringified(customSchema), // (1)!
    })
  ),
});

type _ExtendedSqsEvent = z.infer<typeof extendedSchema>;
