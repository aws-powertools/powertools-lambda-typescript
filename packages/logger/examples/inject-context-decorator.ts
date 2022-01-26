// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { LambdaInterface } from './utils/lambda';
import { Logger } from '../src';
import { Callback, Context } from 'aws-lambda/handler';

const logger = new Logger();

class Lambda implements LambdaInterface {

  @logger.injectLambdaContext()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    logger.info('This is an INFO log with some context');

  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));