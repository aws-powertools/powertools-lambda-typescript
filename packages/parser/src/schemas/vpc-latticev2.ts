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
