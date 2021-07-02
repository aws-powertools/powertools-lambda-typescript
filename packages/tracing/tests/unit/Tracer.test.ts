import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { TracingNamespace as dummyTracingNamespace } from '../../examples/utils/namespaces/hello-world';
import { LambdaInterface } from '../../examples/utils/lambda';
import { Tracer } from '../../src';
import { Callback, Context } from 'aws-lambda/handler';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => null);
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => null);
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => null);

describe('Class: Logger', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    Tracer.coldStart = true;
    consoleDebugSpy.mockClear();
    consoleWarnSpy.mockClear();
    consoleErrorSpy.mockClear();
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
    
    test('when called within a namespace, it returns the parent segment', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
    
      // Act
      let segment: Segment | Subsegment | undefined;
      dummyTracingNamespace(tracer, () => {
        segment = tracer.getSegment();
      });
    
      // Assess
      expect(segment).toBeInstanceOf(Segment);
      expect(segment).toEqual(expect.objectContaining({
        'name': 'facade',
        'trace_id': process.env._X_AMZN_TRACE_ID
      }));
    });
    
    test('when after a subsegment has been created, it returns that same subsegment', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
    
      // Act
      let segment: Segment | Subsegment | undefined;
      let subsegment: Subsegment | undefined;
      dummyTracingNamespace(tracer, () => {
        segment = tracer.provider.getSegment();
        const newSubsegment = segment?.addNewSubsegment('## foo.bar');
        if (newSubsegment !== undefined) {
          tracer.provider.setSegment(newSubsegment);
        }
        const retrievedSegment: Segment | Subsegment | undefined = tracer.getSegment();
        if (retrievedSegment instanceof Subsegment) {
          subsegment = retrievedSegment;
        }
      });

      // Assess
      expect(subsegment).toBeInstanceOf(Subsegment);
      expect(subsegment).toEqual(expect.objectContaining({
        'name': '## foo.bar',
      }));
      expect(subsegment?.parent).toEqual(segment);
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

    test('when called within a namespace, it sets the correct segment', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
                
      // Act
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo.bar');
      let subsegmentSet: Segment | Subsegment | undefined;
      dummyTracingNamespace(tracer, () => {
        tracer.setSegment(newSubsegment);
        subsegmentSet = tracer.provider.getSegment();
      });

      // Assess
      expect(subsegmentSet).toBeInstanceOf(Subsegment);
      expect(subsegmentSet).toEqual(newSubsegment);
    });
  });

  describe('Method: putAnnotation', () => {
    
    test('when called while tracing is disabled, it does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ disabled: true });

      // Act
      let segment: Segment | Subsegment | undefined;
      dummyTracingNamespace(tracer, () => {
        tracer.putAnnotation('foo', 'bar');
        segment = tracer.provider.getSegment();
      });

      if (segment === undefined) {
        throw new Error();
      }
            
      // Assess
      expect('annotations' in segment).toBe(false);
      expect(console.debug).toBeCalledTimes(1);
      expect(console.debug).toHaveBeenNthCalledWith(1, 'Tracing has been disabled, aborting putAnnotation');
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

      // Act
      let segment: Segment | Subsegment | undefined;
      dummyTracingNamespace(tracer, () => {
        tracer.putAnnotation('foo', 'bar');
        segment = tracer.provider.getSegment();
      });

      if (segment === undefined) {
        throw new Error();
      }
            
      // Assess
      expect('annotations' in segment).toBe(false);
      expect(console.debug).toBeCalledTimes(1);
      expect(console.debug).toHaveBeenNthCalledWith(1, 'You cannot annotate the main segment in a Lambda execution environment');
    });

    test('when called within a namespace and on a subsegment, it adds an annotation', () => {
      // Prepare
      const tracer: Tracer = new Tracer();

      // Act
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment('## foo.bar');
      dummyTracingNamespace(tracer, () => {
        tracer.setSegment(newSubsegment);
        tracer.putAnnotation('foo', 'bar');
      });
            
      // Assess
      expect('annotations' in newSubsegment).toBe(true);
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
      const tracer: Tracer = new Tracer({ disabled: true });

      // Act
      let segment: Segment | Subsegment | undefined;
      dummyTracingNamespace(tracer, () => {
        tracer.putMetadata('foo', 'bar');
        segment = tracer.provider.getSegment();
      });

      if (segment === undefined) {
        throw new Error();
      }
            
      // Assess
      expect('annotations' in segment).toBe(false);
      expect(console.debug).toBeCalledTimes(1);
      expect(console.debug).toHaveBeenNthCalledWith(1, 'Tracing has been disabled, aborting putMetadata');
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
      const tracerProviderSpy = jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => new Segment('facade'));

      // Act
      tracer.putMetadata('foo', 'bar');
      const segment = tracer.provider.getSegment();
      tracerProviderSpy.mockClear();
            
      expect.assertions(3);
      if (segment !== undefined) {
        expect('metadata' in segment).toBe(false);
      }
      expect(console.debug).toBeCalledTimes(1);
      expect(console.debug).toHaveBeenNthCalledWith(1, 'You cannot add metadata to the main segment in a Lambda execution environment');

      // Assess
    });

    test('when called within a namespace and on a subsegment, it adds the metadata with the default service name as namespace', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const tracerProviderSetSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation((segment: Segment | Subsegment) => segment);
      const newSubsegment: Segment | Subsegment = new Subsegment('## foo.bar');
      const tracerProviderGetSpy = jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => newSubsegment);
            
      // Act
      tracer.setSegment(newSubsegment);
      tracer.putMetadata('foo', 'bar');
      tracerProviderSetSpy.mockClear();
      tracerProviderGetSpy.mockClear();
            
      // Assess
      expect('metadata' in newSubsegment).toBe(true);
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
      const tracerProviderSetSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation((segment: Segment | Subsegment) => segment);
      const newSubsegment: Segment | Subsegment = new Subsegment('## foo.bar');
      const tracerProviderGetSpy = jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => newSubsegment);

      // Act
      tracer.setSegment(newSubsegment);
      tracer.putMetadata('foo', 'bar', 'baz');
      tracerProviderSetSpy.mockClear();
      tracerProviderGetSpy.mockClear();
            
      // Assess
      expect('metadata' in newSubsegment).toBe(true);
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
      const tracerProviderSetSpy = jest.spyOn(tracer.provider, 'setSegment').mockImplementation((segment: Segment | Subsegment) => segment);
      const newSubsegment: Segment | Subsegment = new Subsegment('## foo.bar');
      const tracerProviderGetSpy = jest.spyOn(tracer.provider, 'getSegment').mockImplementation(() => newSubsegment);

      // Act
      tracer.setSegment(newSubsegment);
      tracer.putMetadata('foo', 'bar');
      tracerProviderSetSpy.mockClear();
      tracerProviderGetSpy.mockClear();
            
      // Assess
      expect('metadata' in newSubsegment).toBe(true);
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
      const tracer: Tracer = new Tracer({ disabled: true });
      let segment: Segment | Subsegment | undefined;
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | any {
          return {
            'foo': 'bar'
          };
        }
            
      }
            
      // Act
      await dummyTracingNamespace(tracer, async () => {
        await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
        segment = tracer.provider.getSegment();
      });

      // Assess
      expect(segment?.subsegments).toBe(undefined);
    });

    test('when used as decorator while POWERTOOLS_TRACER_CAPTURE_RESPONSE is set to false, it does not capture the response as metadata', async () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const tracer: Tracer = new Tracer();
      let segment: Segment | Subsegment | undefined;
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | any {
          return {
            'foo': 'bar'
          };
        }
            
      }
            
      // Act
      await dummyTracingNamespace(tracer, async () => {
        await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
        segment = tracer.provider.getSegment();
      });

      // Assess
      expect(segment?.subsegments?.length).toEqual(1);
      if (segment?.subsegments?.length && segment?.subsegments?.length > 0) {
        expect('metadata' in segment?.subsegments[0]).toBe(false);
      }
      delete process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE;
    });

    test('when used as decorator and with standard config, it captures the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      let segment: Segment | Subsegment | undefined;
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | any {
          return {
            'foo': 'bar'
          };
        }
            
      }
            
      // Act
      await dummyTracingNamespace(tracer, async () => {
        await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
        segment = tracer.provider.getSegment();
      });

      // Assess
      expect(segment?.subsegments?.length).toEqual(1);
      if (segment?.subsegments?.length && segment?.subsegments?.length > 0) {
        expect(segment?.subsegments[0]).toEqual(expect.objectContaining({
          name: '## foo-bar-function',
          metadata: {
            'hello-world': {
              'foo-bar-function response': {
                foo: 'bar',
              },
            },
          }
        }));
      }
    });

    test('when used as decorator while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false, it does not capture the exceptions', async () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      let segment: Segment | Subsegment | undefined;
      class Lambda implements LambdaInterface {
                
        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | any {
          throw new Error('Exception thrown!');
        }
                
      }
            
      // Act
      await dummyTracingNamespace(tracer, async () => {
        //try {
        await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
        //} catch (error) {}
        segment = tracer.provider.getSegment();
      });
            
      // Assess
      expect(segment?.subsegments?.length).toEqual(1);
      if (segment?.subsegments?.length && segment?.subsegments?.length > 0) {
        expect('cause' in segment?.subsegments[0]).toBe(false);
      }
      expect(console.error).toBeCalledTimes(1);
      expect(console.error).toHaveBeenNthCalledWith(1, 'Exception received from foo-bar-function');

      delete process.env.POWERTOOLS_TRACER_CAPTURE_ERROR;
    });

    test('when used as decorator and with standard config, it captures the exception correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      let segment: Segment | Subsegment | undefined;
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | any {
          throw new Error('Exception thrown!');
        }
            
      }
            
      // Act
      await dummyTracingNamespace(tracer, async () => {
        await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
        segment = tracer.provider.getSegment();
      });

      // Assess
      expect(segment?.subsegments?.length).toEqual(1);
      if (segment?.subsegments?.length && segment?.subsegments?.length > 0) {
        expect(segment?.subsegments[0]).toEqual(expect.objectContaining({
          name: '## foo-bar-function',
        }));
        expect('cause' in segment?.subsegments[0]).toBe(true);
      }
      expect(console.error).toBeCalledTimes(1);
      expect(console.error).toHaveBeenNthCalledWith(1, 'Exception received from foo-bar-function');
    });

    test('when used as decorator and with standard config, it annotates ColdStart correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      let segmentFirstInvocation: Segment | Subsegment | undefined;
      let segmentSecondInvocation: Segment | Subsegment | undefined;
      class Lambda implements LambdaInterface {

        @tracer.captureLambdaHanlder()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | any {
          return {
            'foo': 'bar'
          };
        }
            
      }
            
      // Act
      await dummyTracingNamespace(tracer, async () => {
        await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
        segmentFirstInvocation = tracer.provider.getSegment();
      });
      await dummyTracingNamespace(tracer, async () => {
        await new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
        segmentSecondInvocation = tracer.provider.getSegment();
      });

      // Assess
      expect(segmentFirstInvocation?.subsegments?.length).toEqual(1);
      if (segmentFirstInvocation?.subsegments?.length && segmentFirstInvocation?.subsegments?.length > 0) {
        expect(segmentFirstInvocation?.subsegments[0]).toEqual(expect.objectContaining({
          name: '## foo-bar-function',
          annotations: {
            'ColdStart': true,
          }
        }));
      }
      expect(segmentSecondInvocation?.subsegments?.length).toEqual(1);
      if (segmentSecondInvocation?.subsegments?.length && segmentSecondInvocation?.subsegments?.length > 0) {
        expect('annotations' in segmentSecondInvocation?.subsegments[0]).toBe(false);
      }
    });

  });

  describe('Method: captureAWS', () => {
        
    test('when called while tracing is disabled, it does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ disabled: true });

      // Act
      tracer.captureAWS({});

      // Assess
      expect(console.debug).toBeCalledTimes(1);
      expect(console.debug).toHaveBeenNthCalledWith(1, 'Tracing has been disabled, aborting captureAWS');
    });

    test('when called it emits a \'Not Implemented\' warning and does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer();

      // Act
      tracer.captureAWS({});

      // Assess
      // Assess
      expect(console.warn).toBeCalledTimes(1);
      expect(console.warn).toHaveBeenNthCalledWith(1, 'Not implemented');
    });

  });

  describe('Method: captureAWSv3Client', () => {
        
    test('when called while tracing is disabled, it does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ disabled: true });

      // Act
      tracer.captureAWSv3Client({});

      // Assess
      expect(console.debug).toBeCalledTimes(1);
      expect(console.debug).toHaveBeenNthCalledWith(1, 'Tracing has been disabled, aborting captureAWSv3Client');
    });

    test('when called it emits a \'Not Implemented\' warning and does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer();

      // Act
      tracer.captureAWSv3Client({});

      // Assess
      // Assess
      expect(console.warn).toBeCalledTimes(1);
      expect(console.warn).toHaveBeenNthCalledWith(1, 'Not implemented');
    });

  });

  describe('Method: captureAWSClient', () => {
        
    test('when called while tracing is disabled, it does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ disabled: true });

      // Act
      tracer.captureAWSClient({});

      // Assess
      expect(console.debug).toBeCalledTimes(1);
      expect(console.debug).toHaveBeenNthCalledWith(1, 'Tracing has been disabled, aborting captureAWSClient');
    });

    test('when called it emits a \'Not Implemented\' warning and does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer();

      // Act
      tracer.captureAWSClient({});

      // Assess
      // Assess
      expect(console.warn).toBeCalledTimes(1);
      expect(console.warn).toHaveBeenNthCalledWith(1, 'Not implemented');
    });

  });
});