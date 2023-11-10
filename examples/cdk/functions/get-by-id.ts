import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { tableName } from './common/constants';
import { docClient } from './common/dynamodb-client';
import { getUuid } from './common/getUuid';
import { logger, metrics, tracer } from './common/powertools';

/*
 *
 * This example uses the Method decorator instrumentation.
 * Use TypeScript method decorators if you prefer writing your business logic using TypeScript Classes.
 * If you aren’t using Classes, this requires the most significant refactoring.
 * Find more Information in the docs: https://docs.powertools.aws.dev/lambda/typescript/
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {APIGatewayProxyEvent} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Promise<APIGatewayProxyResult>} object - API Gateway Lambda Proxy Output Format
 *
 */

class Lambda implements LambdaInterface {
  @tracer.captureMethod()
  public async getUuid(): Promise<string> {
    return getUuid();
  }

  @tracer.captureLambdaHandler({ captureResponse: false }) // by default the tracer would add the response as metadata on the segment, but there is a chance to hit the 64kb segment size limit. Therefore set captureResponse: false
  @logger.injectLambdaContext({ logEvent: true })
  @metrics.logMetrics({
    throwOnEmptyMetrics: false,
    captureColdStartMetric: true,
  })
  public async handler(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    if (event.httpMethod !== 'GET') {
      throw new Error(
        `getById only accepts GET method, you tried: ${event.httpMethod}`
      );
    }

    // Tracer: Add awsRequestId as annotation
    tracer.putAnnotation('awsRequestId', context.awsRequestId);

    // Logger: Append awsRequestId to each log statement
    logger.appendKeys({
      awsRequestId: context.awsRequestId,
    });

    // Call the getUuid function
    const uuid = await this.getUuid();

    // Logger: Append uuid to each log statement
    logger.appendKeys({ uuid });

    // Tracer: Add uuid as annotation
    tracer.putAnnotation('uuid', uuid);

    // Metrics: Add uuid as metadata
    metrics.addMetadata('uuid', uuid);

    // Get the item from the table
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property
    try {
      if (!tableName) {
        throw new Error('SAMPLE_TABLE environment variable is not set');
      }
      if (!event.pathParameters) {
        throw new Error('event does not contain pathParameters');
      }
      if (!event.pathParameters.id) {
        throw new Error('PathParameter id is missing');
      }
      const data = await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            id: event.pathParameters.id,
          },
        })
      );
      const item = data.Item;

      logger.info(`Response ${event.path}`, {
        statusCode: 200,
        body: item,
      });

      return {
        statusCode: 200,
        body: JSON.stringify(item),
      };
    } catch (err) {
      tracer.addErrorAsMetadata(err as Error);
      logger.error('Error reading from table. ' + err);

      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error reading from table.' }),
      };
    }
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
