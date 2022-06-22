import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

// Create the PowerTools clients
const metrics = new Metrics();
const logger = new Logger();
const tracer = new Tracer();

// Create DynamoDB DocumentClient and patch it for tracing
const docClient = tracer.captureAWSClient(new DocumentClient());

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
export const getAllItemsHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getAllItems only accepts GET method, you tried: ${event.httpMethod}`);
  }

  // Tracer: Get facade segment created by AWS Lambda
  const segment = tracer.getSegment();

  // Tracer: Create subsegment for the function & set it as active
  const handlerSegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
  tracer.setSegment(handlerSegment);

  // Tracer: Annotate the subsegment with the cold start & serviceName
  tracer.annotateColdStart();
  tracer.addServiceNameAnnotation();

  // Tracer: Add annotation for the awsRequestId
  tracer.putAnnotation('awsRequestId', context.awsRequestId);

  // Metrics: Capture cold start metrics
  metrics.captureColdStartMetric();

  // Logger: Add persistent attributes to each log statement
  logger.addPersistentLogAttributes({
    awsRequestId: context.awsRequestId,
  });

  // get all items from the table (only first 1MB data, you can use `LastEvaluatedKey` to get the rest of data)
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property
  // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
  let response;
  try {
    if (!tableName) {
      throw new Error('SAMPLE_TABLE environment variable is not set');
    }

    const data = await docClient.scan({
      TableName: tableName
    }).promise();
    const items = data.Items;

    // Logger: All log statements are written to CloudWatch
    logger.debug(`retrieved items: ${items?.length || 0}`);

    response = {
      statusCode: 200,
      body: JSON.stringify(items)
    };
  } catch (err) {
    tracer.addErrorAsMetadata(err as Error);
    logger.error('Error reading from table. ' + err);
    response = {
      statusCode: 500,
      body: JSON.stringify({ 'error': 'Error reading from table.' })
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