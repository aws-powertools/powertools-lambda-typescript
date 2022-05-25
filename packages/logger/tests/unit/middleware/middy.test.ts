/**
 * Test Logger middleware
 *
 * @group unit/logger/all
 */

import { EnvironmentVariablesService } from '../../../src/config';
import { injectLambdaContext } from '../../../src/middleware/middy';
import { Logger } from './../../../src';
import middy from '@middy/core';
import { PowertoolLogFormatter } from '../../../src/formatter';
import { Console } from 'console';

const mockDate = new Date(1466424490000);

describe('Middy middleware', () => {

  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('injectLambdaContext', () => {

    describe('Feature: add context data', () => {

      test('when a logger object is passed, it adds the context to the logger instance', async () => {

        // Prepare
        const logger = new Logger();
        const debugConsoleMethod = jest.spyOn(logger.getConsole(), 'info').mockImplementation();
        const lambdaHandler = (): void => {
          logger.info('This is an INFO log with some context');
        };
        const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
        const event = { foo: 'bar' };
        const getRandomInt = (): number => Math.floor(Math.random() * 1000000000);

        const awsRequestId = getRandomInt().toString();
        const context = {
          callbackWaitsForEmptyEventLoop: true,
          functionVersion: '$LATEST',
          functionName: 'foo-bar-function',
          memoryLimitInMB: '128',
          logGroupName: '/aws/lambda/foo-bar-function',
          logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
          invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          awsRequestId: awsRequestId,
          getRemainingTimeInMillis: () => 1234,
          done: () => console.log('Done!'),
          fail: () => console.log('Failed!'),
          succeed: () => console.log('Succeeded!'),
        };

        // Act
        await handler(event, context, () => console.log('Lambda invoked!'));

        // Assess
        expect(logger).toEqual(expect.objectContaining({
          logsSampled: false,
          persistentLogAttributes: {},
          powertoolLogData: {
            sampleRateValue: undefined,
            awsRegion: 'eu-west-1',
            environment: '',
            lambdaContext: {
              awsRequestId: awsRequestId,
              coldStart: true,
              functionName: 'foo-bar-function',
              functionVersion: '$LATEST',
              invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
              memoryLimitInMB: 128,
            },
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 'DEBUG',
          logFormatter: expect.any(PowertoolLogFormatter),
        }));

      });

      test('when a logger array is passed, it adds the context to all logger instances', async () => {

        // Prepare
        const logger = new Logger();
        const anotherLogger = new Logger();
        const lambdaHandler = (): void => {
          logger.info('This is an INFO log with some context');
          anotherLogger.info('This is an INFO log with some context');
        };
        const handler = middy(lambdaHandler).use(injectLambdaContext([ logger, anotherLogger ]));
        const event = { foo: 'bar' };

        const getRandomInt = (): number => Math.floor(Math.random() * 1000000000);

        const awsRequestId = getRandomInt().toString();

        const context = {
          callbackWaitsForEmptyEventLoop: true,
          functionVersion: '$LATEST',
          functionName: 'foo-bar-function',
          memoryLimitInMB: '128',
          logGroupName: '/aws/lambda/foo-bar-function',
          logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
          invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          awsRequestId: awsRequestId,
          getRemainingTimeInMillis: () => 1234,
          done: () => console.log('Done!'),
          fail: () => console.log('Failed!'),
          succeed: () => console.log('Succeeded!'),
        };

        // Act
        await handler(event, context, () => console.log('Lambda invoked!'));

        // Assess
        const expectation = expect.objectContaining({
          logsSampled: false,
          persistentLogAttributes: {},
          powertoolLogData: {
            sampleRateValue: undefined,
            awsRegion: 'eu-west-1',
            environment: '',
            lambdaContext: {
              awsRequestId: awsRequestId,
              coldStart: true,
              functionName: 'foo-bar-function',
              functionVersion: '$LATEST',
              invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
              memoryLimitInMB: 128,
            },
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 'DEBUG',
          logFormatter: expect.any(PowertoolLogFormatter),
          console: expect.any(Console),
        });
        expect(logger).toEqual(expectation);
        expect(anotherLogger).toEqual(expectation);

      });

    });

    describe('Feature: clear state', () => {

      test('when enabled and a logger object is passed, it adds the context to the logger instance', async () => {

        // Prepare
        const logger = new Logger({
          logLevel: 'DEBUG',
          persistentLogAttributes: {
            foo: "bar",
            biz: "baz"
          }
        });

        const lambdaHandler = (event: { user_id: string }): void => {
          // Only add these persistent keys for a specific user_id
          if(event['user_id'] === '123456'){
            logger.appendKeys({
              details: { user_id: event['user_id'] }
            });
          }
          logger.debug('This is a DEBUG log with the user_id');
          logger.debug('This is another DEBUG log with the user_id');
        };
        const handler = middy(lambdaHandler).use(injectLambdaContext(logger, { clearState: true }));
        const debugConsoleMethod = jest.spyOn(logger.getConsole(), 'debug').mockImplementation();

        const context = {
          callbackWaitsForEmptyEventLoop: true,
          functionVersion: '$LATEST',
          functionName: 'foo-bar-function',
          memoryLimitInMB: '128',
          logGroupName: '/aws/lambda/foo-bar-function',
          logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
          invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          awsRequestId: "abcdef123456abcdef123456",
          getRemainingTimeInMillis: () => 1234,
          done: () => console.log('Done!'),
          fail: () => console.log('Failed!'),
          succeed: () => console.log('Succeeded!'),
        };

        // Act
        await handler({ user_id: '123456' }, context, () => console.log('Lambda invoked!'));
        await handler({ user_id: '654321' }, context, () => console.log('Lambda invoked a second time!'));

        // Assess
        expect(debugConsoleMethod).toBeCalledTimes(4);
        // First event
        const debugConsoleCall1 = JSON.parse(debugConsoleMethod.mock.calls[0][0]);
        expect(debugConsoleCall1).toEqual({
          "biz": "baz",
          "cold_start": true,
          "details": {
            "user_id": "123456",
          },
          "foo": "bar",
          "function_arn": "arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function",
          "function_memory_size": 128,
          "function_name": "foo-bar-function",
          "function_request_id": "abcdef123456abcdef123456",
          "level": "DEBUG",
          "message": "This is a DEBUG log with the user_id",
          "service": "hello-world",
          "timestamp": expect.any(String),
          "xray_trace_id": "1-5759e988-bd862e3fe1be46a994272793"
        });
        const debugConsoleCall2 = JSON.parse(debugConsoleMethod.mock.calls[1][0]);
        expect(debugConsoleCall2).toEqual({
          "biz": "baz",
          "cold_start": true,
          "details": {
            "user_id": "123456",
          },
          "foo": "bar",
          "function_arn": "arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function",
          "function_memory_size": 128,
          "function_name": "foo-bar-function",
          "function_request_id": "abcdef123456abcdef123456",
          "level": "DEBUG",
          "message": "This is another DEBUG log with the user_id",
          "service": "hello-world",
          "timestamp": expect.any(String),
          "xray_trace_id": "1-5759e988-bd862e3fe1be46a994272793"
        });
        // Second event, which should not have the user_id attribute in the logs
        const debugConsoleCall3 = JSON.parse(debugConsoleMethod.mock.calls[2][0]);
        expect(debugConsoleCall3).toEqual({
          "biz": "baz",
          "cold_start": false,
          "foo": "bar",
          "function_arn": "arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function",
          "function_memory_size": 128,
          "function_name": "foo-bar-function",
          "function_request_id": "abcdef123456abcdef123456",
          "level": "DEBUG",
          "message": "This is a DEBUG log with the user_id",
          "service": "hello-world",
          "timestamp": expect.any(String),
          "xray_trace_id": "1-5759e988-bd862e3fe1be46a994272793"
        });
        const debugConsoleCall4 = JSON.parse(debugConsoleMethod.mock.calls[3][0]);
        expect(debugConsoleCall4).toEqual({
          "biz": "baz",
          "cold_start": false,
          "foo": "bar",
          "function_arn": "arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function",
          "function_memory_size": 128,
          "function_name": "foo-bar-function",
          "function_request_id": "abcdef123456abcdef123456",
          "level": "DEBUG",
          "message": "This is another DEBUG log with the user_id",
          "service": "hello-world",
          "timestamp": expect.any(String),
          "xray_trace_id": "1-5759e988-bd862e3fe1be46a994272793"
        });

      });

    });

  });

});