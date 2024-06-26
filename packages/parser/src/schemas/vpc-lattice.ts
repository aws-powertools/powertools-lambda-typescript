import { z } from 'zod';

/**
 * Zod schema for VPC Lattice event
 *
 * @example
 * ```json
 * {
  "raw_path": "/testpath",
 * "method": "GET",
 * "headers": {
 *   "user_agent": "curl/7.64.1",
 *   "x-forwarded-for": "10.213.229.10",
 *   "host": "test-lambda-service-3908sdf9u3u.dkfjd93.vpc-lattice-svcs.us-east-2.on.aws",
 *   "accept": "*\/*",
 * },
 * "query_string_parameters": {
 *   "order-id": "1"
 * },
 * "body": "eyJ0ZXN0IjogImV2ZW50In0=",
 * "is_base64_encoded": true
 *}
 * ```
 *
 * @see {@link types.VpcLatticeEvent | VpcLatticeEvent}
 * @see {@link https://docs.aws.amazon.com/vpc-lattice/latest/ug/lambda-functions.html#receive-event-from-service}
 */
const VpcLatticeSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  raw_path: z.string(),
  body: z.string(),
  is_base64_encoded: z.boolean(),
  headers: z.record(z.string(), z.string()),
  query_string_parameters: z.record(z.string(), z.string()),
});

export { VpcLatticeSchema };
