import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import {
  HttpStatusCodes,
  type MethodNotAllowedError,
  type NotFoundError,
  Router,
} from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

class Lambda implements LambdaInterface {
  @app.notFound()
  public async handleNotFound(
    error: NotFoundError,
    reqCtx: { req: { headers: { get: (key: string) => string | null } } }
  ) {
    logger.error('Unable to get todo', { error });

    return {
      statusCode: HttpStatusCodes.IM_A_TEAPOT,
      body: "I'm a teapot!",
      headers: {
        'x-correlation-id': reqCtx.req.headers.get('x-correlation-id'),
      },
    };
  }

  @app.methodNotAllowed()
  public async handleMethodNotAllowed(error: MethodNotAllowedError) {
    logger.error('Method not allowed', { error });

    return {
      body: 'This method is not allowed',
    };
  }

  async handler(event: unknown, context: Context) {
    return app.resolve(event, context, { scope: this });
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
