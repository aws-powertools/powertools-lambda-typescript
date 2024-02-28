import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import middy from '@middy/core';
import { tableName } from './common/constants';
import { logger, tracer, metrics } from './common/powertools';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { docClient } from './common/dynamodb-client';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getUuid } from './common/getUuid';

/*
 *
 * This example uses the Middy middleware instrumentation.
 * It is the best choice if your existing code base relies on the Middy middleware engine.
 * Powertools for AWS Lambda (TypeScript) offers compatible Middy middleware to make this integration seamless.
 * Find more Information in the docs: https://docs.powertools.aws.dev/lambda/typescript/
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
const getAllItemsHandler = async (
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

  // Logger: Append awsRequestId to each log statement
  logger.appendKeys({
    awsRequestId: context.awsRequestId,
  });

  const uuid = await getUuid();

  // Logger: Append uuid to each log statement
  logger.appendKeys({ uuid });

  // Tracer: Add uuid as annotation
  tracer.putAnnotation('uuid', uuid);

  // Metrics: Add uuid as metadata
  metrics.addMetadata('uuid', uuid);

  // get all items from the table (only first 1MB data, you can use `LastEvaluatedKey` to get the rest of data)
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property
  // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
  try {
    if (!tableName) {
      throw new Error('SAMPLE_TABLE environment variable is not set');
    }

    const data = await docClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );
    const { Items: items } = data;

    // Logger: All log statements are written to CloudWatch
    logger.debug(`retrieved items: ${items?.length || 0}`);

    logger.info(`Response ${event.path}`, {
      statusCode: 200,
      body: items,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(items),
    };
  } catch (err) {
    tracer.addErrorAsMetadata(err as Error);
    logger.error('Error reading from table. ' + err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error reading from table.' }),
    };
  }
};

// Wrap the handler with middy
export const handler = middy(getAllItemsHandler)
  // Use the middleware by passing the Metrics instance as a parameter
  .use(logMetrics(metrics))
  // Use the middleware by passing the Logger instance as a parameter
  .use(injectLambdaContext(logger, { logEvent: true }))
  // Use the middleware by passing the Tracer instance as a parameter
  .use(captureLambdaHandler(tracer, { captureResponse: false })); // by default the tracer would add the response as metadata on the segment, but there is a chance to hit the 64kb segment size limit. Therefore set captureResponse: false
