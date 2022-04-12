import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDB } from 'aws-sdk';

// Create the PowerTools clients
const metrics = new Metrics();
const logger = new Logger();
const tracer = new Tracer();

// Create DynamoDB DocumentClient and patch it for tracing
const docClient = tracer.captureAWS(new DynamoDB.DocumentClient());

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


export const putItemHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`putItem only accepts POST method, you tried: ${event.httpMethod}`);
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

    // All log statements are written to CloudWatch
    logger.debug('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body!);
    const id = body.id;
    const name = body.name;

    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    var params = {
        TableName: tableName!,
        Item: { id: id, name: name }
    };

    var response;

    try {
        await docClient.put(params).promise();
        response = {
            statusCode: 200,
            body: JSON.stringify(body)
        };
    } catch (err) {
        tracer.addErrorAsMetadata(err as Error);
        logger.error("Error writing data to table. " + err)
        response = {
            statusCode: 500,
            body: JSON.stringify({ "error": "Error writing data to table." })
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
