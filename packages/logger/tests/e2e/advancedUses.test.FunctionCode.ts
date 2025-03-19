import { Logger } from '@aws-lambda-powertools/logger';
import {
  correlationPaths,
  search,
} from '@aws-lambda-powertools/logger/correlationId';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import type { Context } from 'aws-lambda';
import middy from 'middy5';

const logger = new Logger({
  logLevel: 'DEBUG',
  logBufferOptions: {
    enabled: true,
    flushOnErrorLog: true,
  },
  correlationIdSearchFn: search,
});

logger.debug('a never buffered debug log');

export const handlerManual = async (event: unknown) => {
  logger.addContext({} as Context); // we want only the cold start value
  logger.setCorrelationId(event, correlationPaths.EVENT_BRIDGE);

  logger.debug('a buffered debug log');
  logger.info('an info log');
  try {
    throw new Error('ops');
  } catch (error) {
    logger.error('Uncaught error detected, flushing log buffer before exit', {
      error,
    });
  } finally {
    logger.clearBuffer();
  }
};

export const handlerMiddy = middy()
  .use(
    injectLambdaContext(logger, {
      correlationIdPath: correlationPaths.EVENT_BRIDGE,
      flushBufferOnUncaughtError: true,
    })
  )
  .handler(async () => {
    logger.debug('a buffered debug log');
    logger.info('an info log');
    throw new Error('ops');
  });

class Lambda {
  @logger.injectLambdaContext({
    correlationIdPath: correlationPaths.EVENT_BRIDGE,
    flushBufferOnUncaughtError: true,
  })
  public async handler(_event: unknown, _context: Context) {
    logger.debug('a buffered debug log');
    logger.info('an info log');
    throw new Error('ops');
  }
}
const lambda = new Lambda();
export const handlerDecorator = lambda.handler.bind(lambda);
