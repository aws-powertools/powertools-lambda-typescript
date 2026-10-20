import { z } from 'zod';
import type { VpcLatticeEventV2 } from '../types/schema.js';

const VpcLatticeV2RequestContextIdentity = z.object({
  sourceVpcArn: z.string().optional(),
  type: z.string().optional(),
  principal: z.string().optional(),
  principalOrgId: z.string().optional(),
  sessionName: z.string().optional(),
  X509SubjectCn: z.string().optional(),
  X509IssuerOu: z.string().optional(),
  x509SanDns: z.string().optional(),
  x509SanUri: z.string().optional(),
  X509SanNameCn: z.string().optional(),
});

const VpcLatticeV2RequestContext = z.object({
  serviceNetworkArn: z.string(),
  serviceArn: z.string(),
  targetGroupArn: z.string(),
  region: z.string(),
  timeEpoch: z.string(),
  identity: VpcLatticeV2RequestContextIdentity,
});

/**
 * Zod schema for VpcLatticeV2 event
 *
 * @example
 * ```json
 * {
 *   "version": "2.0",
 *   "path": "/echo?QS1=value1&QS1=value2&single=one",
 *   "method": "POST",
 *   "headers": {
 *     "content-type": ["application/json"],
 *     "x-forwarded-for": ["10.42.0.189"],
 *     "header1": ["value1", "value2"],
 *     "host": ["my-service-0123456789abcdef0.7d67968.vpc-lattice-svcs.eu-west-1.on.aws"]
 *   },
 *   "queryStringParameters": {
 *     "QS1": ["value1", "value2"],
 *     "single": ["one"]
 *   },
 *   "body": "{\"hello\":\"world\"}",
 *   "requestContext": {
 *     "serviceNetworkArn": "arn:aws:vpc-lattice:eu-west-1:123456789012:servicenetwork/sn-0123456789abcdef0",
 *     "serviceArn": "arn:aws:vpc-lattice:eu-west-1:123456789012:service/svc-0123456789abcdef0",
 *     "targetGroupArn": "arn:aws:vpc-lattice:eu-west-1:123456789012:targetgroup/tg-0123456789abcdef0",
 *     "identity": {
 *       "sourceVpcArn": "arn:aws:ec2:eu-west-1:123456789012:vpc/vpc-0123456789abcdef0"
 *     },
 *     "region": "eu-west-1",
 *     "timeEpoch": "1790935900260914"
 *   },
 *   "requestId": "6ccfc913-b027-4fdc-be66-a07809329ee3"
 * }
 * ```
 * @see {@link VpcLatticeEventV2 | `VpcLatticeEventV2`}
 * @see {@link https://docs.aws.amazon.com/vpc-lattice/latest/ug/lambda-functions.html#receive-event-from-service}
 */
const VpcLatticeV2Schema = z.object({
  version: z.string(),
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  // VPC Lattice sends every header and query string value as an array, even a single one
  headers: z.record(z.string(), z.array(z.string())),
  queryStringParameters: z.record(z.string(), z.array(z.string())).optional(),
  body: z.string().optional(),
  isBase64Encoded: z.boolean().optional(),
  requestContext: VpcLatticeV2RequestContext,
  requestId: z.string().optional(),
});

export { VpcLatticeV2Schema };
