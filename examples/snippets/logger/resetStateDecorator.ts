import { Logger } from '@aws-lambda-powertools/logger';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';

// Persistent attributes will be cached across invocations
const logger = new Logger({
  logLevel: 'info',
  persistentKeys: {
    environment: 'prod',
  },
});

class Lambda implements LambdaInterface {
  @logger.injectLambdaContext({ resetState: true })
  public async handler(
    event: { userId: string },
    _context: unknown
  ): Promise<void> {
    // This temporary key will be included in the log & cleared after the invocation
    logger.appendKeys({
      details: { userId: event.userId },
    });

    // ... your business logic

    logger.info('WIDE');
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction); // (1)
