import { z } from 'zod';

/**
 * A zod schema for an API Gateway Certificate
 */
const APIGatewayCert = z.object({
  clientCertPem: z.string(),
  subjectDN: z.string(),
  issuerDN: z.string(),
  serialNumber: z.string(),
  validity: z.object({
    notBefore: z.string(),
    notAfter: z.string(),
  }),
});

/**
 * A zod schema for an object with string keys and string values
 */
const APIGatewayRecord = z.record(z.string());

/**
 * A zod schema for an array of strings
 */
const APIGatewayStringArray = z.array(z.string());

/**
 * A zod schema for API Gateway HTTP methods
 */
const APIGatewayHttpMethod = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);

export {
  APIGatewayCert,
  APIGatewayRecord,
  APIGatewayStringArray,
  APIGatewayHttpMethod,
};
