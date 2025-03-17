import type { JSONObject } from '@aws-lambda-powertools/commons/types';
import { search as JMESPathSearch } from '@aws-lambda-powertools/jmespath';
import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';

/**
 * This function is used to search for a correlation ID in the event data and is a wrapper
 * around the JMESPath search function. It allows you to specify a JMESPath expression
 * to extract the correlation ID from the event data.
 * @param expression - The JMESPath expression to use for searching the correlation ID.
 * @param data - The event data to search in.
 */
const search = (expression: string, data: unknown) => {
  return JMESPathSearch(expression, data as JSONObject, {
    customFunctions: new PowertoolsFunctions(),
  });
};

/**
 * The correlationPaths object contains the JMESPath expressions for extracting the correlation ID for various AWS services.
 */
const correlationPaths = {
  /**
   * API Gateway REST API request ID
   */
  API_GATEWAY_REST: 'requestContext.requestId',
  /**
   * API Gateway HTTP API request ID
   */
  API_GATEWAY_HTTP: 'requestContext.requestId',
  /**
   * AppSync API request ID
   */
  APPSYNC_AUTHORIZER: 'requestContext.requestId',
  /**
   * AppSync resolver X-Ray trace ID
   */
  APPSYNC_RESOLVER: 'request.headers."x-amzn-trace-id"',
  /**
   * ALB X-Ray trace ID
   */
  APPLICATION_LOAD_BALANCER: 'headers."x-amzn-trace-id"',
  /**
   * EventBridge event ID
   */
  EVENT_BRIDGE: 'id',
  /**
   * Lambda Function URL request ID
   */
  LAMBDA_FUNCTION_URL: 'requestContext.requestId',
  /**
   * S3 Object trigger request ID
   */
  S3_OBJECT_LAMBDA: 'xAmzRequestId',
  /**
   * VPC Lattice X-Ray trace ID
   */
  VPC_LATTICE: 'headers."x-amzn-trace-id"',
} as const;

export { correlationPaths, search };
