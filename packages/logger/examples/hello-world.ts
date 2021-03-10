process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger();

const lambdaHandler: Handler = async (event, context) => {
  logger.addContext(context);

  logger.debug('This is a DEBUG log', { bar: 'baz' });
  logger.info('This is an INFO log', { bar: 'baz' });
  logger.warn('This is a WARN log', { bar: 'baz' });
  logger.error('This is an ERROR log', { bar: 'baz' });

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => {});

/**
 * Logs output:
 *
 * {
 *   sampling_rate: 1,
 *   service: 'hello-world',
 *   xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
 *   cold_start: true,
 *   lambda_function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
 *   lambda_function_memory_size: 128,
 *   lambda_function_name: 'foo-bar-function',
 *   aws_request_id: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
 *   message: 'This is a DEBUG log',
 *   timestamp: '2021-03-10T01:42:42.664Z',
 *   level: 'DEBUG',
 *   bar: 'baz'
 * }
 * {
 *   sampling_rate: 1,
 *   service: 'hello-world',
 *   xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
 *   cold_start: true,
 *   lambda_function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
 *   lambda_function_memory_size: 128,
 *   lambda_function_name: 'foo-bar-function',
 *   aws_request_id: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
 *   message: 'This is an INFO log',
 *   timestamp: '2021-03-10T01:42:42.667Z',
 *   level: 'INFO',
 *   bar: 'baz'
 * }
 * {
 *   sampling_rate: 1,
 *   service: 'hello-world',
 *   xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
 *   cold_start: true,
 *   lambda_function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
 *   lambda_function_memory_size: 128,
 *   lambda_function_name: 'foo-bar-function',
 *   aws_request_id: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
 *   message: 'This is a WARN log',
 *   timestamp: '2021-03-10T01:42:42.667Z',
 *   level: 'WARN',
 *   bar: 'baz'
 * }
 * {
 *   sampling_rate: 1,
 *   service: 'hello-world',
 *   xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
 *   cold_start: true,
 *   lambda_function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
 *   lambda_function_memory_size: 128,
 *   lambda_function_name: 'foo-bar-function',
 *   aws_request_id: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
 *   message: 'This is an ERROR log',
 *   timestamp: '2021-03-10T01:42:42.667Z',
 *   level: 'ERROR',
 *   bar: 'baz'
 * }
 *
 **/