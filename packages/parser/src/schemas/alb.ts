import { z } from 'zod';

/**
 * Zod schema for Application load balancer event
 *
 * @example
 * ```json
 * {
 *   "requestContext": {
 *     "elb": {
 *       "targetGroupArn": "arn:aws:elasticloadbalancing:region:123456789012:targetgroup/my-target-group/6d0ecf831eec9f09"
 *     }
 *   },
 *   "httpMethod": "GET",
 *   "path": "/",
 *   "queryStringParameters": {
 *     parameters
 *   },
 *   "headers": {
 *     "accept": "text/html,application/xhtml+xml",
 *     "accept-language": "en-US,en;q=0.8",
 *     "content-type": "text/plain",
 *     "cookie": "cookies",
 *     "host": "lambda-846800462-us-east-2.elb.amazonaws.com",
 *     "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)",
 *     "x-amzn-trace-id": "Root=1-5bdb40ca-556d8b0c50dc66f0511bf520",
 *     "x-forwarded-for": "72.21.198.66",
 *     "x-forwarded-port": "443",
 *     "x-forwarded-proto": "https"
 *   },
 *   "isBase64Encoded": false,
 *   "body": "request_body"
 * }
 * ```
 *
 * @see {@link types.ALBEvent | ALBEvent}
 * @see {@link https://docs.aws.amazon.com/elasticloadbalancing/latest/application/lambda-functions.html}
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/services-alb.html}
 */
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

/**
 * Zod schema for Application load balancer event with multi-value headers
 *
 * @example
 * ```json
 * {
 *   "multiValueHeaders": {
 *     "Set-cookie": [
 *       "cookie-name=cookie-value;Domain=myweb.com;Secure;HttpOnly",
 *       "cookie-name=cookie-value;Expires=May 8, 2019"
 *     ],
 *     "Content-Type": [
 *       "application/json"
 *     ]
 *   }
 * }
 * ```
 */
const AlbMultiValueHeadersSchema = AlbSchema.extend({
  multiValueHeaders: z.record(z.string(), z.array(z.string())),
  multiValueQueryStringParameters: z.record(z.string(), z.array(z.string())),
});

export { AlbSchema, AlbMultiValueHeadersSchema };
