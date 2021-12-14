import { EnvironmentVariablesService } from '../../../src/config';
import { PowertoolLogFormatter } from '../../../src/formatter';
import type { Context, Handler } from 'aws-lambda/handler';
import { Logger } from './../../../src';
import middy from '@middy/core';
import { Callback } from 'aws-lambda/handler';
import { injectLambdaContext } from '../../../src/middleware/middy';

describe('Middy middleware', () => {
  describe('injectLambdaContext', () => {

    const ENVIRONMENT_VARIABLES = process.env;

    beforeEach(() => {
      Logger.coldStart = undefined;
      jest.resetModules();
      process.env = { ...ENVIRONMENT_VARIABLES };
    });

    afterAll(() => {
      process.env = ENVIRONMENT_VARIABLES;
    });

      test('when a logger object is passed, it adds the context to the logger instance', async () => {

        // Prepare
        const logger = new Logger();
        const lambdaHandler = (): void => {
          logger.info('This is an INFO log with some context');
        }
        const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
        const event = { foo: 'bar' };
        const getRandomInt = () => {
          return Math.floor(Math.random() * 1000000000);
        }

        const awsRequestId = getRandomInt().toString();
        const context = {
          callbackWaitsForEmptyEventLoop: true,
          functionVersion: '$LATEST',
          functionName: 'foo-bar-function',
          memoryLimitInMB: '128',
          logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
          logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
          invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
          awsRequestId: awsRequestId,
          getRemainingTimeInMillis: () => 1234,
          done: () => console.log('Done!'),
          fail: () => console.log('Failed!'),
          succeed: () => console.log('Succeeded!'),
        };

        // Act
        await handler(event, context, () => console.log('Lambda invoked!'))

        // Assess
        expect(logger).toEqual(expect.objectContaining({
          logsSampled: false,
          persistentLogAttributes: {},
          powertoolLogData: {
            sampleRateValue: undefined,
            awsRegion: 'eu-central-1',
            environment: '',
            lambdaContext: {
              "awsRequestId": awsRequestId,
              "coldStart": true,
              "functionName": "foo-bar-function",
              "functionVersion": "$LATEST",
              "invokedFunctionArn": "arn:aws:lambda:eu-central-1:123456789012:function:Example",
              "memoryLimitInMB": 128
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
      }
      const handler = middy(lambdaHandler).use(injectLambdaContext([ logger, anotherLogger ]));
      const event = { foo: 'bar' };

      const getRandomInt = () => {
        return Math.floor(Math.random() * 1000000000);
      }

      const awsRequestId = getRandomInt().toString();

      const context = {
        callbackWaitsForEmptyEventLoop: true,
        functionVersion: '$LATEST',
        functionName: 'foo-bar-function',
        memoryLimitInMB: '128',
        logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
        logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
        invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
        awsRequestId: awsRequestId,
        getRemainingTimeInMillis: () => 1234,
        done: () => console.log('Done!'),
        fail: () => console.log('Failed!'),
        succeed: () => console.log('Succeeded!'),
      };

      // Act
      await handler(event, context, () => console.log('Lambda invoked!'))

      // Assess
      const expectation = expect.objectContaining({
        powertoolLogData: {
          sampleRateValue: undefined,
          awsRegion: 'eu-central-1',
          environment: '',
          lambdaContext: {
            "awsRequestId": awsRequestId,
            "coldStart": true,
            "functionName": "foo-bar-function",
            "functionVersion": "$LATEST",
            "invokedFunctionArn": "arn:aws:lambda:eu-central-1:123456789012:function:Example",
            "memoryLimitInMB": 128
          },
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        }
      });
      expect(logger).toEqual(anotherLogger);
      expect(anotherLogger).toEqual(expectation);



    });

  });

});