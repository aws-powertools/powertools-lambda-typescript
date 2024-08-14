import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

class Lambda implements LambdaInterface {
  @logger.injectLambdaContext({ logEvent: true }) // (1)
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    // ... your lambda handler
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);
