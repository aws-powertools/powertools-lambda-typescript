import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
import {
  SqsRecordSchema,
  SqsSchema,
} from '@aws-lambda-powertools/parser/schemas';
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
