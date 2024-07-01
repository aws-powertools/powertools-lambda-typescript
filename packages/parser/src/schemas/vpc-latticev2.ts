import { z } from 'zod';

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
 *   "path": "/newpath",
 *   "method": "GET",
 *   "headers": {
 *     "user_agent": "curl/7.64.1",
 *     "x-forwarded-for": "10.213.229.10",
 *     "host": "test-lambda-service-3908sdf9u3u.dkfjd93.vpc-lattice-svcs.us-east-2.on.aws",
 *     "accept": "*]/*"
 *   },
 *   "queryStringParameters": {
 *     "order-id": "1"
 *   },
 *   "body": "{\"message\": \"Hello from Lambda!\"}",
 *   "isBase64Encoded": false,
 *   "requestContext": {
 *     "serviceNetworkArn": "arn:aws:vpc-lattice:us-east-2:123456789012:servicenetwork/sn-0bf3f2882e9cc805a",
 *     "serviceArn": "arn:aws:vpc-lattice:us-east-2:123456789012:service/svc-0a40eebed65f8d69c",
 *     "targetGroupArn": "arn:aws:vpc-lattice:us-east-2:123456789012:targetgroup/tg-6d0ecf831eec9f09",
 *     "identity": {
 *       "sourceVpcArn": "arn:aws:ec2:region:123456789012:vpc/vpc-0b8276c84697e7339",
 *       "type": "AWS_IAM",
 *       "principal": "arn:aws:sts::123456789012:assumed-role/example-role/057d00f8b51257ba3c853a0f248943cf",
 *       "sessionName": "057d00f8b51257ba3c853a0f248943cf",
 *       "x509SanDns": "example.com"
 *     },
 *     "region": "us-east-2",
 *     "timeEpoch": "1696331543569073"
 *   }
 * }
 * ```
 * @see {@link types.VpcLatticeEventV2 | VpcLatticeEventV2}
 * @see {@link https://docs.aws.amazon.com/vpc-lattice/latest/ug/lambda-functions.html#receive-event-from-service}
 */
const VpcLatticeV2Schema = z.object({
  version: z.string(),
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  headers: z.record(z.string(), z.string()),
  queryStringParameters: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  isBase64Encoded: z.boolean().optional(),
  requestContext: VpcLatticeV2RequestContext,
});

export { VpcLatticeV2Schema };
