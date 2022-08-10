/**
 * Test Logger middleware
 *
 * @group unit/logger/all
 */

import { ConfigServiceInterface, EnvironmentVariablesService } from '../../../src/config';
import { injectLambdaContext } from '../../../src/middleware/middy';
import { Logger } from './../../../src';
import middy from '@middy/core';
import { PowertoolLogFormatter } from '../../../src/formatter';
import { Console } from 'console';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

describe('Middy middleware', () => {

  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.resetModules();
    dateSpy.mockClear();
    jest.spyOn(process.stdout, 'write').mockImplementation(() => null as unknown as boolean);
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

  });

  describe('Feature: clear state', () => {

    test('when enabled, the persistent log attributes added within the handler scope are removed after the invocation ends', async () => {

      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
          biz: 'baz'
        }
      });
      const context = {
        callbackWaitsForEmptyEventLoop: true,
        functionVersion: '$LATEST',
        functionName: 'foo-bar-function',
        memoryLimitInMB: '128',
        logGroupName: '/aws/lambda/foo-bar-function',
        logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
        invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        awsRequestId: 'abcdef123456abcdef123456',
        getRemainingTimeInMillis: () => 1234,
        done: () => console.log('Done!'),
        fail: () => console.log('Failed!'),
        succeed: () => console.log('Succeeded!'),
      };

      const lambdaHandler = (event: { user_id: string }): void => {
        // Only add these persistent for the scope of this lambda handler
        logger.appendKeys({
          details: { user_id: event['user_id'] }
        });
        logger.debug('This is a DEBUG log with the user_id');
        logger.debug('This is another DEBUG log with the user_id');
      };
      const handler = middy(lambdaHandler).use(injectLambdaContext(logger, { clearState: true }));
      const persistentAttribs = { ...logger.getPersistentLogAttributes() };

      // Act
      await handler({ user_id: '123456' }, context, () => console.log('Lambda invoked!'));
      const persistentAttribsAfterInvocation = { ...logger.getPersistentLogAttributes() };

      // Assess
      expect(persistentAttribs).toEqual({
        foo: 'bar',
        biz: 'baz'
      });
      expect(persistentAttribsAfterInvocation).toEqual(persistentAttribs);

    });

    test('when enabled and the handler throws an error, the persistent log attributes added within the handler scope are removed after the invocation ends', async () => {

      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
          biz: 'baz'
        }
      });
      const context = {
        callbackWaitsForEmptyEventLoop: true,
        functionVersion: '$LATEST',
        functionName: 'foo-bar-function',
        memoryLimitInMB: '128',
        logGroupName: '/aws/lambda/foo-bar-function',
        logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
        invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        awsRequestId: 'abcdef123456abcdef123456',
        getRemainingTimeInMillis: () => 1234,
        done: () => console.log('Done!'),
        fail: () => console.log('Failed!'),
        succeed: () => console.log('Succeeded!'),
      };

      const lambdaHandler = (event: { user_id: string }): void => {
        // Only add these persistent for the scope of this lambda handler
        logger.appendKeys({
          details: { user_id: event['user_id'] }
        });
        logger.debug('This is a DEBUG log with the user_id');
        logger.debug('This is another DEBUG log with the user_id');

        throw new Error('Unexpected error occurred!');
      };

      const persistentAttribs = { ...logger.getPersistentLogAttributes() };
      const handler = middy(lambdaHandler).use(injectLambdaContext(logger, { clearState: true }));

      // Act & Assess
      const executeLambdaHandler = async (): Promise<void> => {
        await handler({ user_id: '123456' }, context, () => console.log('Lambda invoked!'));
      };
      await expect(executeLambdaHandler()).rejects.toThrow('Unexpected error occurred!');
      const persistentAttribsAfterInvocation = { ...logger.getPersistentLogAttributes() };
      expect(persistentAttribs).toEqual({
        foo: 'bar',
        biz: 'baz'
      });
      expect(persistentAttribsAfterInvocation).toEqual(persistentAttribs);

    });

  });

  describe('Feature: log event', () => {

    test('when a logger is passed with option logEvent set to true, it logs the event', async () => {

      // Prepare
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
      const lambdaHandler = (): void => {
        logger.info('This is an INFO log with some context');
      };
      const handler = middy(lambdaHandler).use(injectLambdaContext(logger , { logEvent: true }));
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
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: awsRequestId,
        level: 'INFO',
        message: 'Lambda invocation event',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        event: {
          foo: 'bar'
        }
      }));

    });

    test('when a logger is passed with option logEvent set to true, while also having a custom configService, it logs the event', async () => {

      // Prepare
      const configService: ConfigServiceInterface = {
        get(name: string): string {
          return `a-string-from-${name}`;
        },
        getCurrentEnvironment(): string {
          return 'dev';
        },
        getLogEvent(): boolean {
          return true;
        },
        getLogLevel(): string {
          return 'INFO';
        },
        getSampleRateValue(): number | undefined {
          return undefined;
        },
        getServiceName(): string {
          return 'my-backend-service';
        },

      };

      const logger = new Logger({
        customConfigService: configService,
      });
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
      const lambdaHandler = (): void => {
        logger.info('This is an INFO log with some context');
      };
      const handler = middy(lambdaHandler).use(injectLambdaContext(logger , { logEvent: true }));
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
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: awsRequestId,
        level: 'INFO',
        message: 'Lambda invocation event',
        service: 'my-backend-service',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        event: {
          foo: 'bar'
        }
      }));

    });

    test('when a logger is passed without options, but POWERTOOLS_LOGGER_LOG_EVENT env var is set to true, it logs the event', async () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
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
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: awsRequestId,
        level: 'INFO',
        message: 'Lambda invocation event',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        event: {
          foo: 'bar'
        }
      }));

    });

    test('when a logger is passed with option logEvent set to false, but POWERTOOLS_LOGGER_LOG_EVENT env var is set to true, it does not log the event', async () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
      const lambdaHandler = (): void => {
        logger.info('This is an INFO log');
      };
      const handler = middy(lambdaHandler).use(injectLambdaContext(logger, { logEvent: false }));
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
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: awsRequestId,
        level: 'INFO',
        message: 'This is an INFO log',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      }));
    });

  });

});

