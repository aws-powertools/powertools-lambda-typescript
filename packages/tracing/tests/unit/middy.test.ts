import { captureLambdaHandler } from '../../src/middleware/middy';
import middy from '@middy/core';
import { Tracer } from './../../src';
import type { Context, Handler } from 'aws-lambda/handler';
import { Segment, setContextMissingStrategy, Subsegment } from 'aws-xray-sdk-core';

jest.spyOn(console, 'debug').mockImplementation(() => null);
jest.spyOn(console, 'warn').mockImplementation(() => null);
jest.spyOn(console, 'error').mockImplementation(() => null);

describe('Middy middlewares', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: true,
    functionVersion: '$LATEST',
    functionName: 'foo-bar-function',
    memoryLimitInMB: '128',
    logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
    logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
    invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
    awsRequestId: Math.floor(Math.random() * 1000000000).toString(),
    getRemainingTimeInMillis: () => 1234,
    done: () => console.log('Done!'),
    fail: () => console.log('Failed!'),
    succeed: () => console.log('Succeeded!'),
  };

  beforeEach(() => {
    Tracer.coldStart = true;
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });
  describe('Middleware: captureLambdaHandler', () => {
    
    test('when used while tracing is disabled, it does nothing', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const setSegmentSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
      const getSegmentSpy = jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => new Segment('facade', process.env._X_AMZN_TRACE_ID || null))
        .mockImplementationOnce(() => new Subsegment('## foo-bar-function'));
      const lambdaHandler: Handler = async (_event: unknown, _context: Context) => ({
        foo: 'bar'
      });
      const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
      const context = Object.assign({}, mockContext);

      // Act
      await handler({}, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(setSegmentSpy).toHaveBeenCalledTimes(0);
      expect(getSegmentSpy).toHaveBeenCalledTimes(0);

    });

    test('when used while tracing is disabled, even if the handler throws an error, it does nothing', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const setSegmentSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
      const getSegmentSpy = jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => new Segment('facade', process.env._X_AMZN_TRACE_ID || null))
        .mockImplementationOnce(() => new Subsegment('## foo-bar-function'));
      const lambdaHandler: Handler = async (_event: unknown, _context: Context) => {
        throw new Error('Exception thrown!');
      };
      const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
      const context = Object.assign({}, mockContext);

      // Act & Assess
      await expect(handler({}, context, () => console.log('Lambda invoked!'))).rejects.toThrowError(Error);
      expect(setSegmentSpy).toHaveBeenCalledTimes(0);
      expect(getSegmentSpy).toHaveBeenCalledTimes(0);
      expect.assertions(3);

    });

    test('when used while POWERTOOLS_TRACER_CAPTURE_RESPONSE is set to false, it does not capture the response as metadata', async () => {
      
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
      const setSegmentSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const lambdaHandler: Handler = async (_event: unknown, _context: Context) => ({
        foo: 'bar'
      });
      const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
      const context = Object.assign({}, mockContext);

      // Act
      await handler({}, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(setSegmentSpy).toHaveBeenCalledTimes(1);
      expect('metadata' in newSubsegment).toBe(false);
      delete process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE;

    });

    test('when used with standard config, it captures the response as metadata', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
      const setSegmentSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const lambdaHandler: Handler = async (_event: unknown, _context: Context) => ({
        foo: 'bar'
      });
      const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
      const context = Object.assign({}, mockContext);

      // Act
      await handler({}, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(setSegmentSpy).toHaveBeenCalledTimes(1);
      expect(setSegmentSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: '## foo-bar-function',
      }));
      expect(newSubsegment).toEqual(expect.objectContaining({
        name: '## foo-bar-function',
        metadata: {
          'hello-world': {
            'foo-bar-function response': {
              foo: 'bar',
            },
          },
        }
      }));

    });

    test('when used while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false, it does not capture the exceptions', async () => {
      
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
      const setSegmentSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
      const addErrorFlagSpy = jest.spyOn(newSubsegment, 'addErrorFlag');
      const lambdaHandler: Handler = async (_event: unknown, _context: Context) => {
        throw new Error('Exception thrown!');
      };
      const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
      const context = Object.assign({}, mockContext);

      // Act & Assess
      await expect(handler({}, context, () => console.log('Lambda invoked!'))).rejects.toThrowError(Error);
      expect(setSegmentSpy).toHaveBeenCalledTimes(1);
      expect(setSegmentSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: '## foo-bar-function',
      }));
      expect('cause' in newSubsegment).toBe(false);
      expect(addErrorFlagSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledTimes(0);
      expect.assertions(6);

      delete process.env.POWERTOOLS_TRACER_CAPTURE_ERROR;

    });

  });

  test('when used with standard config, it captures the exception correctly', async () => {
      
    // Prepare
    const tracer: Tracer = new Tracer();
    const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
    const setSegmentSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
    jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => newSubsegment);
    setContextMissingStrategy(() => null);
    const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
    const lambdaHandler: Handler = async (_event: unknown, _context: Context) => {
      throw new Error('Exception thrown!');
    };
    const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
    const context = Object.assign({}, mockContext);

    // Act & Assess
    await expect(handler({}, context, () => console.log('Lambda invoked!'))).rejects.toThrowError(Error);
    expect(setSegmentSpy).toHaveBeenCalledTimes(1);
    expect(setSegmentSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: '## foo-bar-function',
    }));
    expect('cause' in newSubsegment).toBe(true);
    expect(addErrorSpy).toHaveBeenCalledTimes(1);
    expect(addErrorSpy).toHaveBeenCalledWith(new Error('Exception thrown!'), false);
    expect.assertions(6);

  });

  test('when used with standard config, it annotates ColdStart correctly', async () => {
      
    // Prepare
    const tracer: Tracer = new Tracer();
    const newSubsegmentFirstInvocation: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
    const newSubsegmentSecondInvocation: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
    const setSegmentSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
    jest.spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(() => newSubsegmentFirstInvocation)
      .mockImplementation(() => newSubsegmentSecondInvocation);
    setContextMissingStrategy(() => null);
    const addAnnotationSpy = jest.spyOn(tracer, 'putAnnotation');
    const lambdaHandler: Handler = async (_event: unknown, _context: Context) => ({
      foo: 'bar'
    });
    const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
    const context = Object.assign({}, mockContext);

    // Act
    await handler({}, context, () => console.log('Lambda invoked!'));
    await handler({}, context, () => console.log('Lambda invoked!'));
    
    // Assess
    expect(setSegmentSpy).toHaveBeenCalledTimes(2);
    expect(setSegmentSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: '## foo-bar-function',
    }));
    expect(addAnnotationSpy).toHaveBeenCalledTimes(1);
    expect(addAnnotationSpy).toHaveBeenCalledWith('ColdStart', true);
    expect(newSubsegmentFirstInvocation).toEqual(expect.objectContaining({
      name: '## foo-bar-function',
      annotations: {
        'ColdStart': true,
      }
    }));
    expect(newSubsegmentSecondInvocation).toEqual(expect.objectContaining({
      name: '## foo-bar-function'
    }));

  });

});