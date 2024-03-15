import { ItemNotFound } from '#errors';
import { getItemDynamoDB } from '#helpers/get-item';
import { assertIsError } from '#helpers/utils';
import { logger, metrics, tracer } from '#powertools';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

/*
 *
 * This example uses the Method decorator instrumentation.
 *
 * Use TypeScript method decorators if you prefer writing your business logic using TypeScript Classes.
 * If you aren’t using Classes, this requires the most significant refactoring.
 *
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
  public async getItem(itemId: string): Promise<{ id: string; name: string }> {
    const item = (await getItemDynamoDB(itemId, logger)) as {
      id: string;
      name: string;
    };

    if (!item) {
      throw new ItemNotFound('item not found');
    }

    return item;
  }

  @tracer.captureLambdaHandler()
  @logger.injectLambdaContext({ logEvent: true, clearState: true })
  @metrics.logMetrics({
    throwOnEmptyMetrics: false,
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
    if (!event.pathParameters) {
      throw new Error('event does not contain pathParameters');
    }
    if (!event.pathParameters.id) {
      throw new Error('PathParameter id is missing');
    }
    const { id: itemId } = event.pathParameters;

    // Tracer: Add awsRequestId as annotation
    tracer.putAnnotation('awsRequestId', context.awsRequestId);

    // Logger: Append itemId to each log statement
    logger.appendKeys({ itemId });

    // Tracer: Add itemId as annotation, so you can search traces by itemId
    tracer.putAnnotation('itemId', itemId);

    try {
      const item = await this.getItem(itemId);

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'success', item }),
      };
    } catch (err) {
      assertIsError(err);

      let statusCode = 500;
      let message = 'unable to get item from table';

      if (err instanceof ItemNotFound) {
        statusCode = 404;
        message = err.message;
      }

      logger.error('error reading from table', { err });

      return {
        statusCode,
        body: JSON.stringify({ message, itemId }),
      };
    }
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
