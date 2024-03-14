import { PutCommand } from '@aws-sdk/lib-dynamodb';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import type { Subsegment } from 'aws-xray-sdk-core';
import { tableName } from '#constants';
import { docClient } from '#clients/dynamodb';
import { logger, metrics, tracer } from '#powertools';

/**
 *
 * This example uses the manual instrumentation.
 *
 * This instrumentation, although more verbose, is the best choice if you want to have full control over how the tracing, logging, and metrics are added to your code
 * or if you don't want to use decorators (see `get-by-id.ts`) or Middy.js middlewares (`get-all-items.ts`).
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {APIGatewayProxyEvent} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Promise<APIGatewayProxyResult>} object - API Gateway Lambda Proxy Output Format
 *
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `putItem only accepts POST method, you tried: ${event.httpMethod}`
    );
  }
  if (!tableName) {
    throw new Error('SAMPLE_TABLE environment variable is not set');
  }
  if (!event.body) {
    throw new Error('Event does not contain body');
  }

  // Logger: Log the incoming event
  logger.debug('event', { event });

  // Tracer: Get facade segment created by AWS Lambda
  const segment = tracer.getSegment();

  // Tracer: Create subsegment for the function & set it as active
  let handlerSegment: Subsegment | undefined;
  if (segment) {
    handlerSegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
    tracer.setSegment(handlerSegment);
  }

  // Tracer: Annotate the subsegment with the cold start & serviceName
  tracer.annotateColdStart();
  tracer.addServiceNameAnnotation();

  // Tracer: Add awsRequestId as annotation
  tracer.putAnnotation('awsRequestId', context.awsRequestId);

  // Metrics: Capture cold start metrics
  metrics.captureColdStartMetric();

  // Logger: Append awsRequestId to each log statement
  logger.appendKeys({
    awsRequestId: context.awsRequestId,
  });

  // Metrics: Add uuid as metadata
  // metrics.addMetadata('uuid', uuid);

  // Creates a new item, or replaces an old item with a new item
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
  try {
    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const { id, name } = body;

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          id,
          name,
        },
      })
    );

    logger.info(`Response ${event.path}`, {
      statusCode: 200,
      body,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (err) {
    tracer.addErrorAsMetadata(err as Error);
    logger.error('Error writing data to table. ' + err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error writing data to table.' }),
    };
  } finally {
    if (segment && handlerSegment) {
      // Tracer: Close subsegment (the AWS Lambda one is closed automatically)
      handlerSegment.close(); // (## index.handler)
      // Tracer: Set the facade segment as active again (the one created by AWS Lambda)
      tracer.setSegment(segment);
    }
  }
};
