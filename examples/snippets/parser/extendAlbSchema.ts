import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
import { AlbSchema } from '@aws-lambda-powertools/parser/schemas/alb';
import { z } from 'zod';

const customSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const extendedSchema = AlbSchema.extend({
  body: JSONStringified(customSchema),
});

type _ExtendedAlbEvent = z.infer<typeof extendedSchema>;
