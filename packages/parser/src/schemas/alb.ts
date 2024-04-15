import { z } from 'zod';

const AlbSchema = z.object({
  httpMethod: z.string(),
  path: z.string(),
  body: z.string(),
  isBase64Encoded: z.boolean(),
  headers: z.record(z.string(), z.string()).optional(),
  queryStringParameters: z.record(z.string(), z.string()).optional(),
  requestContext: z.object({
    elb: z.object({
      targetGroupArn: z.string(),
    }),
  }),
});

const AlbMultiValueHeadersSchema = AlbSchema.extend({
  multiValueHeaders: z.record(z.string(), z.array(z.string())),
  multiValueQueryStringParameters: z.record(z.string(), z.array(z.string())),
});

export { AlbSchema, AlbMultiValueHeadersSchema };
