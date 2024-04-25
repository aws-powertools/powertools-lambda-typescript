import { Logger } from '@aws-lambda-powertools/logger';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';

// Persistent attributes added outside the handler will be
// cached across invocations
const logger = new Logger({
  logLevel: 'DEBUG',
  persistentLogAttributes: {
    foo: 'bar',
    biz: 'baz',
  },
});

class Lambda implements LambdaInterface {
  // Enable the clear state flag
  @logger.injectLambdaContext({ clearState: true })
  public async handler(
    event: { specialKey: string },
    _context: unknown
  ): Promise<void> {
    // Persistent attributes added inside the handler will NOT be cached
    // across invocations
    if (event['specialKey'] === '123456') {
      logger.appendKeys({
        details: { specialKey: '123456' },
      });
    }
    logger.debug('This is a DEBUG log');
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction); // (1)
