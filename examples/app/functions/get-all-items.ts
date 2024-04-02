import { scanItemsDynamoDB } from '#helpers/scan-items';
import { assertIsError } from '#helpers/utils';
import { logger, metrics, tracer } from '#powertools';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

/*
 *
 * This example uses the Middy middleware instrumentation.
 * It is the best choice if your existing code base relies on the Middy middleware engine.
 * Powertools for AWS Lambda (TypeScript) offers compatible Middy middleware to make this integration seamless.
 *
 * Find more Information in the docs: https://docs.powertools.aws.dev/lambda/typescript/
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
const functionHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getAllItems only accepts GET method, you tried: ${event.httpMethod}`
    );
  }

  // Tracer: Add awsRequestId as annotation
  tracer.putAnnotation('awsRequestId', context.awsRequestId);

  try {
    const items = await scanItemsDynamoDB(logger);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'success', items }),
    };
  } catch (error) {
    assertIsError(error);

    logger.error('error reading from table', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error reading from table.' }),
    };
  }
};

// Wrap the handler with middy and apply the middlewares
export const handler = middy(functionHandler)
  .use(logMetrics(metrics))
  .use(injectLambdaContext(logger, { logEvent: true, clearState: true }))
  // Since we are returning multiple items and the X-Ray segment limit is 64kb, we disable response capture to avoid data loss
  .use(captureLambdaHandler(tracer, { captureResponse: false }));
