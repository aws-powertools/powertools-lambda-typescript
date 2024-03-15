import { ssmParameterName } from '#constants';
import { getSSMStringParameter } from '#helpers/get-string-param';
import { putItemInDynamoDB } from '#helpers/put-item';
import { assertIsError } from '#helpers/utils';
import { logger, metrics, tracer } from '#powertools';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import type { Subsegment } from 'aws-xray-sdk-core';

// Initialize the persistence store for idempotency
const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: await getSSMStringParameter(ssmParameterName),
});
// Define the idempotency configuration
const idempotencyConfig = new IdempotencyConfig({
  useLocalCache: true,
  maxLocalCacheSize: 500,
  expiresAfterSeconds: 60 * 60 * 24,
});

/**
 * Make the `putItemInDynamoDB` function idempotent by wrapping it with the `makeIdempotent` function.
 *
 * The function will now return the same result for the same input, even if the function is called multiple times.
 *
 * In this case, it won't write a new item to the DynamoDB table if the name was already processed.
 */
const idempotentPutItem = makeIdempotent(putItemInDynamoDB, {
  persistenceStore,
  config: idempotencyConfig,
});

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
  // Logger: Log the incoming event
  logger.debug('event', { event });

  if (event.httpMethod !== 'POST') {
    throw new Error(
      `putItem only accepts POST method, you tried: ${event.httpMethod}`
    );
  }
  if (!event.body) {
    throw new Error('Event does not contain body');
  }

  // Register the Lambda context with the idempotency configuration so that it can handle function timeouts
  idempotencyConfig.registerLambdaContext(context);
  // And do the same with the Logger so that all logs have contextual information
  logger.addContext(context);

  // Get facade segment created by AWS Lambda, create subsegment for the function, and set it as active
  const segment = tracer.getSegment();
  let handlerSegment: Subsegment | undefined;
  if (segment) {
    handlerSegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
    tracer.setSegment(handlerSegment);
  }

  // Annotate the subsegment with the cold start & serviceName
  tracer.annotateColdStart();
  tracer.addServiceNameAnnotation();

  // Capture cold start metric
  metrics.captureColdStartMetric();

  try {
    // Get the name from the body of the request
    const body = JSON.parse(event.body);
    const { name } = body;

    const item = await idempotentPutItem(name, logger);

    // Create a custom metric to count the number of items added
    metrics.addMetric('itemsAdded', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'success', item }),
    };
  } catch (err) {
    assertIsError(err);

    // Add the error to the subsegment so it shows up in the trace
    tracer.addErrorAsMetadata(err);
    // Create a custom metric to count the number of errors
    metrics.addMetric('itemsInsertErrors', MetricUnit.Count, 1);

    logger.error('error storing item', err);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'error writing data to table' }),
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
