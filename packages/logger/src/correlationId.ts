import type { JSONObject } from '@aws-lambda-powertools/commons/types';
import { search as JMESPathSearch } from '@aws-lambda-powertools/jmespath';
import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';

const search = (expression: string, data: JSONObject) => {
  return JMESPathSearch(expression, data, {
    customFunctions: new PowertoolsFunctions(),
  });
};

const correlationPaths = {
  API_GATEWAY_REST: 'requestContext.requestId',
  API_GATEWAY_HTTP: 'requestContext.requestId',
  APPSYNC_AUTHORIZER: 'requestContext.requestId',
  APPSYNC_RESOLVER: 'request.headers."x-amzn-trace-id"',
  APPLICATION_LOAD_BALANCER: 'headers."x-amzn-trace-id"',
  EVENT_BRIDGE: 'id',
  LAMBDA_FUNCTION_URL: 'requestContext.requestId',
  S3_OBJECT_LAMBDA: 'xAmzRequestId',
  VPC_LATTICE: 'headers."x-amzn-trace-id"',
};

export { correlationPaths, search };
