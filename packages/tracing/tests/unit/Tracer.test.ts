import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { LambdaInterface } from '../../examples/utils/lambda';
import { Tracer } from '../../src';
import { Callback, Context } from 'aws-lambda/handler';
import { Segment, setContextMissingStrategy, Subsegment } from 'aws-xray-sdk-core';

jest.spyOn(console, 'debug').mockImplementation(() => null);
jest.spyOn(console, 'warn').mockImplementation(() => null);
jest.spyOn(console, 'error').mockImplementation(() => null);

describe('Class: Tracer', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    Tracer.coldStart = true;
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: isColdStart', () => {

    test('when called, it returns false the first time and always true after that', () => {
    
      // Assess
      expect(Tracer.isColdStart()).toBe(true);
      expect(Tracer.isColdStart()).toBe(false);
      expect(Tracer.isColdStart()).toBe(false);
      expect(Tracer.isColdStart()).toBe(false);
    
    });
    
  });

  describe('Method: getSegment', () => {

    test('when called outside of a namespace or without parent segment, it throws an error', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
    
      // Act / Assess
      expect(() => {
        tracer.getSegment();
      }).toThrow('Failed to get the current sub/segment from the context.');

    });

    test('when called outside of a namespace or without parent segment, it throws an error', () => {

      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => undefined);
    
      // Act / Assess
      expect(() => {
        tracer.getSegment();
      }).toThrow('Failed to get the current sub/segment from the context.');

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
    test('when called outside of a namespace or without parent segment, it throws an error', () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
    
      // Act / Assess
      expect(() => {
        const newSubsegment = new Subsegment('## foo.bar');
        tracer.setSegment(newSubsegment);
      }).toThrow('No context available. ns.run() or ns.bind() must be called first.');
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

  describe('Method: captureLambdaHanlder', () => {
  
    test('when used as decorator while tracing is disabled, it does nothing', async () => {
     
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => new Segment('facade', process.env._X_AMZN_TRACE_ID || null));
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return new Promise((resolve, _reject) => resolve({
            foo: 'bar'
          } as unknown as TResult));
        }
            
      }
            
      // Act
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(0);

    });

    test('when used as decorator while POWERTOOLS_TRACER_CAPTURE_RESPONSE is set to false, it does not capture the response as metadata', async () => {

      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
      jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return new Promise((resolve, _reject) => resolve({
            foo: 'bar'
          } as unknown as TResult));
        }
            
      }
            
      // Act
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect('metadata' in newSubsegment).toBe(false);
      delete process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE;
    
    });

    test('when used as decorator and with standard config, it captures the response as metadata', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return new Promise((resolve, _reject) => resolve({
            foo: 'bar'
          } as unknown as TResult));
        }
            
      }
            
      // Act
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith('## foo-bar-function', expect.anything());
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

    test('when used as decorator while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false, it does not capture the exceptions', async () => {

      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
      const addErrorFlagSpy = jest.spyOn(newSubsegment, 'addErrorFlag');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          throw new Error('Exception thrown!');
        }
            
      }
            
      // Act
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(newSubsegment).toEqual(expect.objectContaining({
        name: '## foo-bar-function',
      }));
      expect('cause' in newSubsegment).toBe(false);
      expect(addErrorFlagSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledTimes(0);

      delete process.env.POWERTOOLS_TRACER_CAPTURE_ERROR;
    });

    test('when used as decorator and with standard config, it captures the exception correctly', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          throw new Error('Exception thrown!');
        }
            
      }
            
      // Act
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(newSubsegment).toEqual(expect.objectContaining({
        name: '## foo-bar-function',
      }));
      expect('cause' in newSubsegment).toBe(true);
      expect(addErrorSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledWith(new Error('Exception thrown!'), false);
    
    });

    test('when used as decorator and with standard config, it annotates ColdStart correctly', async () => {
      
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegmentFirstInvocation: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
      const newSubsegmentSecondInvocation: Segment | Subsegment | undefined = new Subsegment('## foo-bar-function');
      jest.spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => newSubsegmentFirstInvocation)
        .mockImplementation(() => newSubsegmentSecondInvocation);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      const addAnnotationSpy = jest.spyOn(tracer, 'putAnnotation');
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return new Promise((resolve, _reject) => resolve({
            foo: 'bar'
          } as unknown as TResult));
        }
            
      }
            
      // Act
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(2);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith('## foo-bar-function', expect.anything());
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

  describe('Method: captureMethod', () => {

    test('when called while tracing is disabled, it does nothing', async () => {

      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAsyncFuncSpy = jest.spyOn(tracer.provider, 'captureAsyncFunc');
      class Lambda implements LambdaInterface {

        // TODO: revisit return type & make it more specific
        @tracer.captureMethod()
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
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

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
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

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
      await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

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
      const captureAWSClientSpy = jest.spyOn(tracer.provider, 'captureAWSClient')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWSClient({});

      // Assess
      expect(captureAWSClientSpy).toBeCalledTimes(0);
    
    });

    test('when called it returns the decorated object that was passed to it', () => {
    
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSClientSpy = jest.spyOn(tracer.provider, 'captureAWSClient')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWSClient({});

      // Assess
      expect(captureAWSClientSpy).toBeCalledTimes(1);
      expect(captureAWSClientSpy).toBeCalledWith({});
    
    });

  });
});