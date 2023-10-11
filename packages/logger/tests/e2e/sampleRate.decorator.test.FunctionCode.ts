import { Logger } from '../../src';
import { TestEvent, TestOutput } from '../helpers/types';
import { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';

const SAMPLE_RATE = parseFloat(process.env.SAMPLE_RATE || '0.1');
const LOG_MSG = process.env.LOG_MSG || 'Hello World';

const logger = new Logger({
  sampleRateValue: SAMPLE_RATE,
});

class Lambda implements LambdaInterface {
  private readonly logMsg: string;

  public constructor() {
    this.logMsg = LOG_MSG;
  }

  // Decorate your handler class method
  @logger.injectLambdaContext()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handler(event: TestEvent, context: Context): TestOutput {
    this.printLogInAllLevels();

    return {
      requestId: context.awsRequestId,
    };
  }

  private printLogInAllLevels(): void {
    logger.debug(this.logMsg);
    logger.info(this.logMsg);
    logger.warn(this.logMsg);
    logger.error(this.logMsg);
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);
