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

describe('Middy middleware', () => {

  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.resetModules();
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

    describe('Feature: clear state', () => {

      test('when enabled, the persistent log attributes added in the handler are removed after the handler\'s code is executed', async () => {

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

    });

  });

});