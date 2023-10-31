import {z} from 'zod';

const AlbSchema = z.object({
  httpMethod: z.string(),
  path: z.string(),
  body: z.string(),
  isBase64Encoded: z.boolean(),
  headers: z.record(z.string(), z.string()),
  queryStringParameters: z.record(z.string(), z.string()),
  requestContext: z.object({
    elb: z.object({
      targetGroupArn: z.string(),
    }),
  }),
})

export {
  AlbSchema,
}