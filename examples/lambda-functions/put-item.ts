import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { tableName } from './common/constants';
import { logger, tracer, metrics } from './common/powertools';
import { docClient } from './common/dynamodb-client';
import { PutItemCommand } from '@aws-sdk/lib-dynamodb';
import got from 'got';

/*
 *
 * This example uses the manual instrumentation.
 * 
 */

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(`putItem only accepts POST method, you tried: ${event.httpMethod}`);
  }

  // Logger: Log the incoming event
  logger.info('Lambda invocation event', event);

  // Tracer: Get facade segment created by AWS Lambda
  const segment = tracer.getSegment();

  // Tracer: Create subsegment for the function & set it as active
  const handlerSegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
  tracer.setSegment(handlerSegment);

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

  // Request a sample random uuid from a webservice
  const res = await got('https://httpbin.org/uuid');
  const uuid = JSON.parse(res.body).uuid;

  // Logger: Append uuid to each log statement
  logger.appendKeys({ uuid });

  // Tracer: Add uuid as annotation
  tracer.putAnnotation('uuid', uuid);

  // Metrics: Add uuid as metadata
  metrics.addMetadata('uuid', uuid);

  // Define response object
  let response;

  // Creates a new item, or replaces an old item with a new item
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
  try {
    if (!tableName) {
      throw new Error('SAMPLE_TABLE environment variable is not set');
    }
    if (!event.body) {
      throw new Error('Event does not contain body');
    }

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const id = body.id;
    const name = body.name;

    await docClient.send(new PutItemCommand({
      TableName: tableName,
      Item: { id: { S: id }, name: { S: name } }
    }));
    response = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
  } catch (err) {
    tracer.addErrorAsMetadata(err as Error);
    logger.error('Error writing data to table. ' + err);
    response = {
      statusCode: 500,
      body: JSON.stringify({ 'error': 'Error writing data to table.' })
    };
  }

  // Tracer: Close subsegment (the AWS Lambda one is closed automatically)
  handlerSegment.close(); // (## index.handler)

  // Tracer: Set the facade segment as active again (the one created by AWS Lambda)
  tracer.setSegment(segment);

  // All log statements are written to CloudWatch
  logger.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);

  return response;
};
