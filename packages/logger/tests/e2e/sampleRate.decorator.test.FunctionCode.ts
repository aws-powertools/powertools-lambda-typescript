import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';
import { Logger } from '../../src/index.js';
import type { TestEvent, TestOutput } from '../helpers/types.js';

const SAMPLE_RATE = Number.parseFloat(process.env.SAMPLE_RATE || '0.1');
const LOG_MSG = process.env.LOG_MSG || 'Hello World';

const logger = new Logger({
  sampleRateValue: SAMPLE_RATE,
});
let firstInvocation = true;

class Lambda implements LambdaInterface {
  private readonly logMsg: string;

  public constructor() {
    this.logMsg = LOG_MSG;
  }

  // Decorate your handler class method
  @logger.injectLambdaContext()
  public async handler(_event: TestEvent, context: Context): TestOutput {
    if (firstInvocation) {
      firstInvocation = false;
    } else {
      logger.refreshSampleRateCalculation();
    }
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
