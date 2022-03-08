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

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

const consoleSpy = {
  'info': jest.spyOn(console, 'info').mockImplementation(),
  'log': jest.spyOn(console, 'log').mockImplementation(),
};

describe('Middy middleware', () => {

  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    consoleSpy['info'].mockClear();
    consoleSpy['log'].mockClear();
    dateSpy.mockClear();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('injectLambdaContext', () => {

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
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
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
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });
      expect(logger).toEqual(anotherLogger);
      expect(anotherLogger).toEqual(expectation);

    });

    test('when a logger is passed with option logEvent set to true, it logs the event', async () => {

      // Prepare
      const logger = new Logger();
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
      expect(consoleSpy['info']).toBeCalledTimes(2);
      expect(consoleSpy['info']).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: awsRequestId,
        level: 'INFO',
        message: 'Lambda invocation event',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
        event: {
          foo: 'bar'
        }
      }));



    });


    test('when a logger is passed with option logEvent set to true, it logs the event', async () => {

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
      // Prepare

      const logger = new Logger({
        customConfigService: configService,
      });
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
      expect(consoleSpy['info']).toBeCalledTimes(2);
      expect(consoleSpy['info']).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: awsRequestId,
        level: 'INFO',
        message: 'Lambda invocation event',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
        event: {
          foo: 'bar'
        }
      }));



    });

  });

});