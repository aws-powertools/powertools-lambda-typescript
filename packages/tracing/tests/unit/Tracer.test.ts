/**
 * Test Tracer class
 *
 * @group unit/tracer/all
 */

import { Tracer } from '../../src';
import { Callback, Context, Handler } from 'aws-lambda/handler';
import { Segment, setContextMissingStrategy, Subsegment } from 'aws-xray-sdk-core';
import { DynamoDB } from 'aws-sdk';

interface LambdaInterface {
  handler: Handler
}

jest.spyOn(console, 'debug').mockImplementation(() => null);
jest.spyOn(console, 'warn').mockImplementation(() => null);
jest.spyOn(console, 'error').mockImplementation(() => null);

describe('Class: Tracer', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const event = {
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
  };
  const context = {
    callbackWaitsForEmptyEventLoop: true,
    functionVersion: '$LATEST',
    functionName: 'foo-bar-function',
    memoryLimitInMB: '128',
    logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
    logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
    invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
    awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
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

  describe('Method: annotateColdStart', () => {

    test('when called while tracing is disabled, it does nothing', () => {

      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putAnnotationSpy = jest.spyOn(tracer, 'putAnnotation');

      // Act
      tracer.annotateColdStart();

      // Assess
      expect(putAnnotationSpy).toBeCalledTimes(0);

    });

    test('when called multiple times, it annotates true the first time and then false afterwards', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      const putAnnotationSpy = jest.spyOn(tracer, 'putAnnotation').mockImplementation(() => null);

      // Act
      tracer.annotateColdStart();
      tracer.annotateColdStart();
      tracer.annotateColdStart();
      tracer.annotateColdStart();

      // Assess
      expect(putAnnotationSpy).toBeCalledTimes(4);
      expect(putAnnotationSpy.mock.calls).toEqual([
        [ 'ColdStart', true ],
        [ 'ColdStart', false ],
        [ 'ColdStart', false ],
        [ 'ColdStart', false ],
      ]);

    });

  });

  describe('Method: addServiceNameAnnotation', () => {

    test('when called while tracing is disabled, it does nothing', () => {

      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putAnnotation = jest.spyOn(tracer, 'putAnnotation');

      // Act
      tracer.addServiceNameAnnotation();

      // Assess
      expect(putAnnotation).toBeCalledTimes(0);

    });

    test('when called while a serviceName has been set, it adds it as annotation', () => {

      // Prepare
      const tracer: Tracer = new Tracer({ serviceName: 'foo' });
      const putAnnotation = jest.spyOn(tracer, 'putAnnotation').mockImplementation(() => null);

      // Act
      tracer.addServiceNameAnnotation();

      // Assess
      expect(putAnnotation).toBeCalledTimes(1);
      expect(putAnnotation).toBeCalledWith('Service', 'foo');

    });

    test('when called while a serviceName has not been set, it does nothing', () => {

      // Prepare
      delete process.env.POWERTOOLS_SERVICE_NAME;
      const tracer: Tracer = new Tracer();
      const putAnnotation = jest.spyOn(tracer, 'putAnnotation').mockImplementation(() => null);

      // Act
      tracer.addServiceNameAnnotation();

      // Assess
      expect(putAnnotation).toBeCalledTimes(0);

    });

  });

  describe('Method: addResponseAsMetadata', () => {

    test('when called while tracing is disabled, it does nothing', () => {

      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putMetadataSpy = jest.spyOn(tracer, 'putMetadata');

      // Act
      tracer.addResponseAsMetadata({ foo: 'bar' }, context.functionName);

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(0);

    });

    test('when called while POWERTOOLS_TRACER_CAPTURE_RESPONSE is set to false, it does nothing', () => {

      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = jest.spyOn(tracer, 'putMetadata');

      // Act
      tracer.addResponseAsMetadata({ foo: 'bar' }, context.functionName);

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(0);
      delete process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE;

    });

    test('when called with data equal to undefined, it does nothing', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = jest.spyOn(tracer, 'putMetadata');

      // Act
      tracer.addResponseAsMetadata(undefined, context.functionName);

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(0);

    });

    test('when called with default config, it calls tracer.putMetadata correctly', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = jest.spyOn(tracer, 'putMetadata').mockImplementation(() => null);

      // Act
      tracer.addResponseAsMetadata({ foo: 'bar' }, context.functionName);

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(1);
      expect(putMetadataSpy).toBeCalledWith(`${context.functionName} response`, expect.objectContaining({ foo: 'bar' }));

    });

  });

  describe('Method: addErrorAsMetadata', () => {

    test('when called while tracing is disabled, it does nothing', () => {

      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const getSegmentSpy = jest.spyOn(tracer, 'getSegment');

      // Act
      tracer.addErrorAsMetadata(new Error('foo'));

      // Assess
      expect(getSegmentSpy).toBeCalledTimes(0);

    });

    test('when called while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false, it does not capture the error', () => {

      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      const subsegment = new Subsegment(`## ${context.functionName}`);
      jest.spyOn(tracer, 'getSegment').mockImplementation(() => subsegment);
      const addErrorFlagSpy = jest.spyOn(subsegment, 'addErrorFlag');
      const addErrorSpy = jest.spyOn(subsegment, 'addError');

      // Act
      tracer.addErrorAsMetadata(new Error('foo'));

      // Assess
      expect(addErrorFlagSpy).toBeCalledTimes(1);
      expect(addErrorSpy).toBeCalledTimes(0);
      delete process.env.POWERTOOLS_TRACER_CAPTURE_ERROR;

    });

    test('when called with default config, it calls subsegment.addError correctly', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      const subsegment = new Subsegment(`## ${context.functionName}`);
      jest.spyOn(tracer, 'getSegment').mockImplementation(() => subsegment);
      const addErrorFlagSpy = jest.spyOn(subsegment, 'addErrorFlag');
      const addErrorSpy = jest.spyOn(subsegment, 'addError');

      // Act
      tracer.addErrorAsMetadata(new Error('foo'));

      // Assess
      expect(addErrorFlagSpy).toBeCalledTimes(0);
      expect(addErrorSpy).toBeCalledTimes(1);
      expect(addErrorSpy).toBeCalledWith(new Error('foo'), false);

    });

  });

  describe('Method: getColdStart', () => {

    test('when called, it returns false the first time and always true after that', () => {
    
      // Assess
      expect(Tracer.getColdStart()).toBe(true);
      expect(Tracer.getColdStart()).toBe(false);
      expect(Tracer.getColdStart()).toBe(false);
      expect(Tracer.getColdStart()).toBe(false);
    
    });
    
  });

  describe('Method: getSegment', () => {

    test('when called outside of a namespace or without parent segment, and tracing is enabled, it throws an error', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
    
      // Act / Assess
      expect(() => {
        tracer.getSegment();
      }).toThrow('Failed to get the current sub/segment from the context.');

    });

    test('when called and no segment is returned, while tracing is enabled, it throws an error', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => undefined);
    
      // Act / Assess
      expect(() => {
        tracer.getSegment();
      }).toThrow('Failed to get the current sub/segment from the context.');

    });

    test('when called outside of a namespace or without parent segment, and tracing is disabled, it returns a dummy subsegment', () => {

      // Prepare
      delete process.env.AWS_EXECUTION_ENV; // This will disable the tracer, simulating local execution
      const tracer: Tracer = new Tracer();

      // Act
      const segment = tracer.getSegment();

      // Assess
      expect(segment).toBeInstanceOf(Subsegment);
      expect(segment.name).toBe('## Dummy segment');

    });

    test('when called within a namespace, it returns the parent segment', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => new Segment('facade', process.env._X_AMZN_TRACE_ID || null));
    
      // Act
      const segment = tracer.getSegment();
    
      // Assess
      expect(segment).toBeInstanceOf(Segment);
      expect(segment).toEqual(expect.objectContaining({
        'name': 'facade',
        'trace_id': process.env._X_AMZN_TRACE_ID
      }));

    });

  });

  describe('Method: setSegment', () => {
    test('when called outside of a namespace or without parent segment, and Tracer is enabled, it throws an error', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
    
      // Act / Assess
      expect(() => {
        const newSubsegment = new Subsegment('## foo.bar');
        tracer.setSegment(newSubsegment);
      }).toThrow('No context available. ns.run() or ns.bind() must be called first.');
    });

    test('when called outside of a namespace or without parent segment, and tracing is disabled, it does nothing', () => {
      
      // Prepare
      delete process.env.AWS_EXECUTION_ENV; // This will disable the tracer, simulating local execution
      const tracer: Tracer = new Tracer();
      const setSegmentSpy = jest.spyOn(tracer.provider, 'setSegment');
    
      // Act
      const newSubsegment = new Subsegment('## foo.bar');
      tracer.setSegment(newSubsegment);
      
      // Assess
      expect(setSegmentSpy).toBeCalledTimes(0);

    });

    test('when called within a namespace, it sets the segment', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => new Segment('facade', process.env._X_AMZN_TRACE_ID || null));
      const providerSetSegmentSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation(() => ({}));
                
      // Act
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo.bar');
      tracer.setSegment(newSubsegment);

      // Assess
      expect(providerSetSegmentSpy).toBeCalledTimes(1);
      expect(providerSetSegmentSpy).toBeCalledWith(expect.objectContaining({
        'id': newSubsegment.id,
        'name': newSubsegment.name
      }));

    });

  });

  describe('Method: putAnnotation', () => {
    
    test('when called while tracing is disabled, it does nothing', () => {

      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const facadeSegment = new Segment('facade', process.env._X_AMZN_TRACE_ID || null);
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => facadeSegment);
      const addAnnotationSpy = jest.spyOn(facadeSegment, 'addAnnotation');

      // Act
      tracer.putAnnotation('foo', 'bar');
      
      // Assess
      expect('annotations' in facadeSegment).toBe(false);
      expect(addAnnotationSpy).toBeCalledTimes(0);

    });
    
    test('when called outside of a namespace or without parent segment, it throws an error', () => {

      // Prepare
      const tracer: Tracer = new Tracer();

      // Act / Assess
      expect(() => {
        tracer.putAnnotation('foo', 'bar');
      }).toThrow('Failed to get the current sub/segment from the context.');

    });

    test('when called within a namespace and on the main segment, it does nothing', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const facadeSegment = new Segment('facade', process.env._X_AMZN_TRACE_ID || null);
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => facadeSegment);
      const addAnnotationSpy = jest.spyOn(facadeSegment, 'addAnnotation');

      // Act
      tracer.putAnnotation('foo', 'bar');
      
      // Assess
      expect('annotations' in facadeSegment).toBe(false);
      expect(addAnnotationSpy).toBeCalledTimes(0);
      expect(console.warn).toBeCalledTimes(1);
      expect(console.warn).toHaveBeenNthCalledWith(1, 'You cannot annotate the main segment in a Lambda execution environment');

    });

    test('when called within a namespace and on a subsegment, it adds an annotation', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo.bar');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      const addAnnotationSpy = jest.spyOn(newSubsegment, 'addAnnotation');

      // Act
      tracer.putAnnotation('foo', 'bar');
            
      // Assess
      expect('annotations' in newSubsegment).toBe(true);
      expect(addAnnotationSpy).toBeCalledTimes(1);
      expect(addAnnotationSpy).toBeCalledWith('foo', 'bar');
      expect(newSubsegment).toEqual(expect.objectContaining({
        'annotations': {
          foo: 'bar'
        }
      }));

    });

  });

  describe('Method: putMetadata', () => {
    
    test('when called while tracing is disabled, it does nothing', () => {
  
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const facadeSegment = new Segment('facade', process.env._X_AMZN_TRACE_ID || null);
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => facadeSegment);
      const addMetadataSpy = jest.spyOn(facadeSegment, 'addMetadata');

      // Act
      tracer.putMetadata('foo', 'bar');
      
      // Assess
      expect('metadata' in facadeSegment).toBe(false);
      expect(addMetadataSpy).toBeCalledTimes(0);

    });

    test('when called outside of a namespace or without parent segment, it throws an error', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      
      // Act / Assess
      expect(() => {
        tracer.putMetadata('foo', 'bar');
      }).toThrow('Failed to get the current sub/segment from the context.');

    });
    
    test('when called within a namespace and on the main segment, it does nothing', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const facadeSegment = new Segment('facade', process.env._X_AMZN_TRACE_ID || null);
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => facadeSegment);
      const addMetadataSpy = jest.spyOn(facadeSegment, 'addMetadata');
      
      // Act
      tracer.putMetadata('foo', 'bar');
      
      // Assess
      expect('metadata' in facadeSegment).toBe(false);
      expect(addMetadataSpy).toBeCalledTimes(0);
      expect(console.warn).toBeCalledTimes(1);
      expect(console.warn).toHaveBeenNthCalledWith(1, 'You cannot add metadata to the main segment in a Lambda execution environment');
      
    });
    
    test('when called within a namespace and on a subsegment, it adds the metadata with the default service name as namespace', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo.bar');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      const addMetadataSpy = jest.spyOn(newSubsegment, 'addMetadata');
      
      // Act
      tracer.putMetadata('foo', 'bar');
      
      // Assess
      expect('metadata' in newSubsegment).toBe(true);
      expect(addMetadataSpy).toBeCalledTimes(1);
      expect(addMetadataSpy).toBeCalledWith('foo', 'bar', 'hello-world');
      expect(newSubsegment).toEqual(expect.objectContaining({
        'metadata': {
          'hello-world': {
            foo: 'bar'
          }
        }
      }));
    });
    
    test('when called within a namespace and on a subsegment, and with a custom namespace as an argument, it adds the metadata correctly', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo.bar');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      const addMetadataSpy = jest.spyOn(newSubsegment, 'addMetadata');
      
      // Act
      tracer.putMetadata('foo', 'bar', 'baz');
      
      // Assess
      expect('metadata' in newSubsegment).toBe(true);
      expect(addMetadataSpy).toBeCalledTimes(1);
      expect(addMetadataSpy).toBeCalledWith('foo', 'bar', 'baz');
      expect(newSubsegment).toEqual(expect.objectContaining({
        'metadata': {
          'baz': {
            foo: 'bar'
          }
        }
      }));

    });
    
    test('when called within a namespace and on a subsegment, and while a custom namespace was set in the class, it adds the metadata correctly', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer({ serviceName: 'baz' });
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo.bar');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      const addMetadataSpy = jest.spyOn(newSubsegment, 'addMetadata');

      // Act
      tracer.putMetadata('foo', 'bar');
            
      // Assess
      expect('metadata' in newSubsegment).toBe(true);
      expect(addMetadataSpy).toBeCalledTimes(1);
      expect(addMetadataSpy).toBeCalledWith('foo', 'bar', 'baz');
      expect(newSubsegment).toEqual(expect.objectContaining({
        'metadata': {
          'baz': {
            foo: 'bar'
          }
        }
      }));
    
    });

  });

  describe('Method: captureLambdaHandler', () => {
  
    test('when used as decorator while tracing is disabled, it does nothing', async () => {
     
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => new Segment('facade', process.env._X_AMZN_TRACE_ID || null));
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHandler()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return new Promise((resolve, _reject) => resolve({
            foo: 'bar'
          } as unknown as TResult));
        }
            
      }
            
      // Act
      await new Lambda().handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(0);

    });

    test('when used as decorator while POWERTOOLS_TRACER_CAPTURE_RESPONSE is set to false, it does not capture the response as metadata', async () => {

      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## index.handler');
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHandler()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return new Promise((resolve, _reject) => resolve({
            foo: 'bar'
          } as unknown as TResult));
        }
            
      }
            
      // Act
      await new Lambda().handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect('metadata' in newSubsegment).toBe(false);
      delete process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE;
    
    });

    test('when used as decorator and with standard config, it captures the response as metadata', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## index.handler');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHandler()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return new Promise((resolve, _reject) => resolve({
            foo: 'bar'
          } as unknown as TResult));
        }
            
      }
            
      // Act
      await new Lambda().handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith('## index.handler', expect.anything());
      expect(newSubsegment).toEqual(expect.objectContaining({
        name: '## index.handler',
        metadata: {
          'hello-world': {
            'index.handler response': {
              foo: 'bar',
            },
          },
        }
      }));

    });

    test('when used as decorator while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false, it does not capture the exceptions', async () => {

      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## index.handler');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
      const addErrorFlagSpy = jest.spyOn(newSubsegment, 'addErrorFlag');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHandler()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          throw new Error('Exception thrown!');
        }
            
      }
            
      // Act & Assess
      await expect(new Lambda().handler({}, context, () => console.log('Lambda invoked!'))).rejects.toThrowError(Error);
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(newSubsegment).toEqual(expect.objectContaining({
        name: '## index.handler',
      }));
      expect('cause' in newSubsegment).toBe(false);
      expect(addErrorFlagSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledTimes(0);
      expect.assertions(6);

      delete process.env.POWERTOOLS_TRACER_CAPTURE_ERROR;

    });

    test('when used as decorator and with standard config, it captures the exception correctly', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## index.handler');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => new Segment('facade', process.env._X_AMZN_TRACE_ID || null))
        .mockImplementation(() => newSubsegment);
      /* jest.spyOn(tracer.provider, 'captureAsyncFunc').mockImplementation(
        () => tracer.provider.captureAsyncFunc('## index.handler', )); */
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHandler()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          throw new Error('Exception thrown!');
        }
            
      }
            
      // Act & Assess
      await expect(new Lambda().handler({}, context, () => console.log('Lambda invoked!'))).rejects.toThrowError(Error);
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(newSubsegment).toEqual(expect.objectContaining({
        name: '## index.handler',
      }));
      expect('cause' in newSubsegment).toBe(true);
      expect(addErrorSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledWith(new Error('Exception thrown!'), false);
      expect.assertions(6);
    
    });

    test('when used as decorator and with standard config, it annotates ColdStart correctly', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegmentFirstInvocation: Segment | Subsegment | undefined = new Subsegment('## index.handler');
      const newSubsegmentSecondInvocation: Segment | Subsegment | undefined = new Subsegment('## index.handler');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => newSubsegmentFirstInvocation)
        .mockImplementation(() => newSubsegmentSecondInvocation);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      const putAnnotationSpy = jest.spyOn(tracer, 'putAnnotation');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHandler()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return new Promise((resolve, _reject) => resolve({
            foo: 'bar'
          } as unknown as TResult));
        }
            
      }
            
      // Act
      await new Lambda().handler(event, context, () => console.log('Lambda invoked!'));
      await new Lambda().handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(2);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith('## index.handler', expect.anything());
      expect(putAnnotationSpy.mock.calls.filter(call => 
        call[0] === 'ColdStart'
      )).toEqual([
        [ 'ColdStart', true ],
        [ 'ColdStart', false ],
      ]);
      expect(newSubsegmentFirstInvocation).toEqual(expect.objectContaining({
        name: '## index.handler',
        annotations: expect.objectContaining({
          'ColdStart': true,
        })
      }));
      expect(newSubsegmentSecondInvocation).toEqual(expect.objectContaining({
        name: '## index.handler',
        annotations: expect.objectContaining({
          'ColdStart': false,
        })
      }));

    });

    test('when used as decorator and with standard config, it annotates Service correctly', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## index.handler');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHandler()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return new Promise((resolve, _reject) => resolve({
            foo: 'bar'
          } as unknown as TResult));
        }
            
      }
            
      // Act
      await new Lambda().handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith('## index.handler', expect.anything());
      expect(newSubsegment).toEqual(expect.objectContaining({
        name: '## index.handler',
        annotations: expect.objectContaining({
          'Service': 'hello-world',
        })
      }));

    });

  });

  describe('Method: captureMethod', () => {

    test('when called while tracing is disabled, it does nothing', async () => {

      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        // TODO: revisit return type & make it more specific
        @tracer.captureMethod()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public async dummyMethod(some: string): Promise<any> {
          return new Promise((resolve, _reject) => resolve(some));
        }

        public async handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): Promise<TResult> {
          const result = await this.dummyMethod('foo bar');
          
          return new Promise((resolve, _reject) => resolve(result as unknown as TResult));
        }

      }

      // Act
      await new Lambda().handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toBeCalledTimes(0);

    });

    test('when used as decorator and with standard config, it captures the response as metadata', async () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('### dummyMethod');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        @tracer.captureMethod()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public async dummyMethod(some: string): Promise<string> {
          return new Promise((resolve, _reject) => setTimeout(() => resolve(some), 3000));
        }

        public async handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): Promise<TResult> {
          const result = await this.dummyMethod('foo bar');
          
          return new Promise((resolve, _reject) => resolve(result as unknown as TResult));
        }

      }

      // Act
      await new Lambda().handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith('### dummyMethod', expect.anything());
      expect(newSubsegment).toEqual(expect.objectContaining({
        name: '### dummyMethod',
        metadata: {
          'hello-world': {
            'dummyMethod response': 'foo bar',
          },
        }
      }));

    });

    test('when used as decorator and with standard config, it captures the exception correctly', async () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('### dummyMethod');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
      class Lambda implements LambdaInterface {

        @tracer.captureMethod()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public async dummyMethod(_some: string): Promise<string> {
          throw new Error('Exception thrown!');
        }

        public async handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): Promise<TResult> {
          const result = await this.dummyMethod('foo bar');
          
          return new Promise((resolve, _reject) => resolve(result as unknown as TResult));
        }

      }

      // Act
      await new Lambda().handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(newSubsegment).toEqual(expect.objectContaining({
        name: '### dummyMethod',
      }));
      expect('cause' in newSubsegment).toBe(true);
      expect(addErrorSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledWith(new Error('Exception thrown!'), false);

    });

  });

  describe('Method: captureAWS', () => {
        
    test('when called while tracing is disabled, it does nothing', () => {

      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAWSSpy = jest.spyOn(tracer.provider, 'captureAWS')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWS({});

      // Assess
      expect(captureAWSSpy).toBeCalledTimes(0);

    });

    test('when called it returns the decorated object that was passed to it', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSSpy = jest.spyOn(tracer.provider, 'captureAWS')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWS({});

      // Assess
      expect(captureAWSSpy).toBeCalledTimes(1);
      expect(captureAWSSpy).toBeCalledWith({});

    });

  });

  describe('Method: captureAWSv3Client', () => {
        
    test('when called while tracing is disabled, it does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAWSv3ClientSpy = jest.spyOn(tracer.provider, 'captureAWSv3Client')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWSv3Client({});

      // Assess
      expect(captureAWSv3ClientSpy).toBeCalledTimes(0);
    
    });

    test('when called it returns the decorated object that was passed to it', () => {
    
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSv3ClientSpy = jest.spyOn(tracer.provider, 'captureAWSv3Client')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWSv3Client({});

      // Assess
      expect(captureAWSv3ClientSpy).toBeCalledTimes(1);
      expect(captureAWSv3ClientSpy).toBeCalledWith({});
    
    });

  });

  describe('Method: captureAWSClient', () => {
        
    test('when called while tracing is disabled, it does nothing', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAWSClientSpy = jest.spyOn(tracer.provider, 'captureAWSClient');

      // Act
      const client = tracer.captureAWSClient(new DynamoDB());

      // Assess
      expect(captureAWSClientSpy).toBeCalledTimes(0);
      expect(client).toBeInstanceOf(DynamoDB);
    
    });

    test('when called with a base AWS SDK v2 client, it returns it back instrumented', () => {
    
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSClientSpy = jest.spyOn(tracer.provider, 'captureAWSClient');

      // Act
      const client = tracer.captureAWSClient(new DynamoDB());

      // Assess
      expect(captureAWSClientSpy).toBeCalledTimes(1);
      expect(captureAWSClientSpy).toBeCalledWith(client);
      expect(client).toBeInstanceOf(DynamoDB);
    
    });

    test('when called with a complex AWS SDK v2 client, it returns it back instrumented', () => {
    
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSClientSpy = jest.spyOn(tracer.provider, 'captureAWSClient');

      // Act
      const client = tracer.captureAWSClient(new DynamoDB.DocumentClient());

      // Assess
      expect(captureAWSClientSpy).toBeCalledTimes(2);
      expect(captureAWSClientSpy).toHaveBeenNthCalledWith(1, client);
      expect(captureAWSClientSpy).toHaveBeenNthCalledWith(2, (client as unknown as DynamoDB & { service: DynamoDB }).service);
      expect(client).toBeInstanceOf(DynamoDB.DocumentClient);
    
    });

    test('when called with an uncompatible object, it throws an error', () => {
    
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSClientSpy = jest.spyOn(tracer.provider, 'captureAWSClient');

      // Act / Assess
      expect(() => {
        tracer.captureAWSClient({});
      }).toThrow('service.customizeRequests is not a function');
      expect(captureAWSClientSpy).toBeCalledTimes(2);
      expect(captureAWSClientSpy).toHaveBeenNthCalledWith(1, {});
      expect(captureAWSClientSpy).toHaveBeenNthCalledWith(2, undefined);
      expect.assertions(4);
      
    });

  });
});