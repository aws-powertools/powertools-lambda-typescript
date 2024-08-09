import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
import { AlbSchema } from '@aws-lambda-powertools/parser/schemas';
import { z } from 'zod';

const customSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const extendedSchema = AlbSchema.extend({
  body: JSONStringified(customSchema), // (1)!
});
