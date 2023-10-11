/**
 * Test Tracer class
 *
 * @group unit/tracer/all
 */
import {
  ContextExamples as dummyContext,
  Events as dummyEvent,
} from '@aws-lambda-powertools/commons';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Tracer } from './../../src';
import type { Callback, Context } from 'aws-lambda/handler';
import {
  Segment,
  setContextMissingStrategy,
  Subsegment,
} from 'aws-xray-sdk-core';
import { ProviderServiceInterface } from '../../src/provider';
import { ConfigServiceInterface } from 'packages/tracer/src/config';

type CaptureAsyncFuncMock = jest.SpyInstance<
  unknown,
  [
    name: string,
    fcn: (subsegment?: Subsegment) => unknown,
    parent?: Segment | Subsegment,
  ]
>;
const createCaptureAsyncFuncMock = function (
  provider: ProviderServiceInterface,
  subsegment?: Subsegment
): CaptureAsyncFuncMock {
  return jest
    .spyOn(provider, 'captureAsyncFunc')
    .mockImplementation(async (methodName, callBackFn) => {
      if (!subsegment) {
        subsegment = new Subsegment(`### ${methodName}`);
      }
      jest.spyOn(subsegment, 'flush').mockImplementation(() => null);
      await callBackFn(subsegment);
    });
};

jest.spyOn(console, 'log').mockImplementation(() => null);
jest.spyOn(console, 'debug').mockImplementation(() => null);
jest.spyOn(console, 'warn').mockImplementation(() => null);
jest.spyOn(console, 'error').mockImplementation(() => null);

describe('Class: Tracer', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext.helloworldContext;
  const event = dummyEvent.Custom.CustomEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: constructor', () => {
    it('instantiates with default settings when no option is passed', () => {
      // Prepare & Act
      const tracer = new Tracer(undefined);

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: true,
          serviceName: 'hello-world',
          captureHTTPsRequests: true,
        })
      );
    });

    it('uses the provided options when passed ', () => {
      // Prepare
      const tracerOptions = {
        enabled: false,
        serviceName: 'my-lambda-service',
        captureHTTPsRequests: false,
      };

      // Act
      const tracer = new Tracer(tracerOptions);

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: false,
          serviceName: 'my-lambda-service',
          captureHTTPsRequests: false,
        })
      );
    });

    it('uses the default service name when an invalid one is passed', () => {
      // Prepare
      const tracerOptions = {
        serviceName: '',
      };

      // Act
      const tracer = new Tracer(tracerOptions);

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: true,
          serviceName: 'hello-world',
          captureHTTPsRequests: true,
        })
      );
    });

    it('uses the custom config service when one is passed', () => {
      // Prepare
      const configService: ConfigServiceInterface = {
        get(name: string): string {
          return `a-string-from-${name}`;
        },
        getCaptureHTTPsRequests(): string {
          return 'false';
        },
        getTracingEnabled(): string {
          return 'false';
        },
        getTracingCaptureResponse(): string {
          return 'false';
        },
        getTracingCaptureError(): string {
          return 'false';
        },
        getServiceName(): string {
          return 'my-backend-service';
        },
      };

      // Act
      const tracer = new Tracer({
        customConfigService: configService,
      });

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(
        expect.objectContaining({
          customConfigService: configService,
          tracingEnabled: false,
          serviceName: 'my-backend-service',
          captureHTTPsRequests: false,
        })
      );
    });

    it('sets captureHTTPsGlobal to true by default when tracing is enabled', () => {
      // Prepare
      const tracerOptions = {
        enabled: true,
      };

      // Act
      const tracer = new Tracer(tracerOptions);

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: true,
          captureHTTPsRequests: true,
        })
      );
    });
  });

  describe('Environment Variables configs', () => {
    test('when AWS_EXECUTION_ENV environment variable is equal to AWS_Lambda_amplify-mock, tracing is disabled', () => {
      // Prepare
      process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_amplify-mock';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: false,
        })
      );
    });

    test('when AWS_SAM_LOCAL environment variable is set, tracing is disabled', () => {
      // Prepare
      process.env.AWS_SAM_LOCAL = 'true';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: false,
        })
      );
    });

    test('when AWS_EXECUTION_ENV environment variable is set, tracing is enabled', () => {
      // Prepare
      process.env.AWS_EXECUTION_ENV = 'nodejs16.x';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: true,
        })
      );
    });

    test('when AWS_EXECUTION_ENV environment variable is NOT set, tracing is disabled', () => {
      // Prepare
      delete process.env.AWS_EXECUTION_ENV;

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: false,
        })
      );
    });

    test('when POWERTOOLS_TRACE_ENABLED environment variable is set, a tracer with tracing disabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACE_ENABLED = 'false';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: false,
        })
      );
    });

    test('when POWERTOOLS_SERVICE_NAME environment variable is set, a tracer with the correct serviceName is returned', () => {
      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = 'my-backend-service';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          serviceName: 'my-backend-service',
        })
      );
    });

    test('when POWERTOOLS_TRACER_CAPTURE_RESPONSE environment variable is set, a tracer with captureResponse disabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          captureResponse: false,
        })
      );
    });

    test('when POWERTOOLS_TRACER_CAPTURE_RESPONSE environment variable is set to invalid value, a tracer with captureResponse enabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = '';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          captureResponse: true,
        })
      );
    });

    test('when POWERTOOLS_TRACER_CAPTURE_ERROR environment variable is set, a tracer with captureError disabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          captureError: false,
        })
      );
    });

    test('when POWERTOOLS_TRACER_CAPTURE_ERROR environment variable is set to invalid value, a tracer with captureError enabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = '';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          captureError: true,
        })
      );
    });

    test('when POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS environment variable is set, captureHTTPsGlobal is called', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS = 'false';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          captureHTTPsRequests: false,
        })
      );
    });

    test('when POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS environment variable is set to invalid value, captureHTTPsGlobal is called', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS = '';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          captureHTTPsRequests: true,
        })
      );
    });
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
      const putAnnotationSpy = jest
        .spyOn(tracer, 'putAnnotation')
        .mockImplementation(() => null);

      // Act
      tracer.annotateColdStart();
      tracer.annotateColdStart();
      tracer.annotateColdStart();
      tracer.annotateColdStart();

      // Assess
      expect(putAnnotationSpy).toBeCalledTimes(4);
      expect(putAnnotationSpy.mock.calls).toEqual([
        ['ColdStart', true],
        ['ColdStart', false],
        ['ColdStart', false],
        ['ColdStart', false],
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
      const putAnnotation = jest
        .spyOn(tracer, 'putAnnotation')
        .mockImplementation(() => null);

      // Act
      tracer.addServiceNameAnnotation();

      // Assess
      expect(putAnnotation).toBeCalledTimes(1);
      expect(putAnnotation).toBeCalledWith('Service', 'foo');
    });

    test('when called when a serviceName has not been set in the constructor or environment variables, it adds the default service name as an annotation', () => {
      // Prepare
      delete process.env.POWERTOOLS_SERVICE_NAME;
      const tracer: Tracer = new Tracer();
      const putAnnotation = jest
        .spyOn(tracer, 'putAnnotation')
        .mockImplementation(() => null);

      // Act
      tracer.addServiceNameAnnotation();

      // Assess
      expect(putAnnotation).toBeCalledTimes(1);
      expect(putAnnotation).toBeCalledWith('Service', 'service_undefined');
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
      const putMetadataSpy = jest
        .spyOn(tracer, 'putMetadata')
        .mockImplementation(() => null);

      // Act
      tracer.addResponseAsMetadata({ foo: 'bar' }, context.functionName);

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(1);
      expect(putMetadataSpy).toBeCalledWith(
        `${context.functionName} response`,
        expect.objectContaining({ foo: 'bar' })
      );
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

    test('when called and the segment is not found, it returns instead of throwing', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer, 'getSegment').mockImplementation(() => undefined);

      // Act & Assess
      expect(() => tracer.addErrorAsMetadata(new Error('foo'))).not.toThrow();
    });
  });

  describe('Method: getRootXrayTraceId', () => {
    test('when called, it returns the X-Ray trace ID', () => {
      // Prepare
      const tracer: Tracer = new Tracer();

      // Act
      const xRayTraceId = tracer.getRootXrayTraceId();

      // Assess
      expect(xRayTraceId).toBe('1-abcdef12-3456abcdef123456abcdef12');
    });
  });

  describe('Method: getSegment', () => {
    test('when called and no segment is returned, it logs a warning', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => undefined);
      jest.spyOn(console, 'warn').mockImplementation(() => null);

      // Act
      tracer.getSegment();

      // Assess
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to get the current sub/segment from the context, this is likely because you are not using the Tracer in a Lambda function.'
      );
    });

    test('when called outside of a namespace or without parent segment, and tracing is disabled, it returns a dummy subsegment', () => {
      // Prepare
      delete process.env.AWS_EXECUTION_ENV; // This will disable the tracer, simulating local execution
      const tracer: Tracer = new Tracer();

      // Act
      const segment = tracer.getSegment();

      // Assess
      expect(segment).toBeInstanceOf(Subsegment);
      expect((segment as Subsegment).name).toBe('## Dummy segment');
    });

    test('when called within a namespace, it returns the parent segment', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(
          () => new Segment('facade', process.env._X_AMZN_TRACE_ID || null)
        );

      // Act
      const segment = tracer.getSegment();

      // Assess
      expect(segment).toBeInstanceOf(Segment);
      expect(segment).toEqual(
        expect.objectContaining({
          name: 'facade',
          trace_id: process.env._X_AMZN_TRACE_ID,
        })
      );
    });
  });

  describe('Method: isTraceSampled', () => {
    test('when called, it returns true if the Sampled flag is set', () => {
      // Prepare
      const tracer: Tracer = new Tracer();

      // Act
      const xRayTraceSampled = tracer.isTraceSampled();

      // Assess
      expect(xRayTraceSampled).toBe(false);
    });

    test('when called and Trace is disabled, it returns false', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });

      // Act
      const xRayTraceSampled = tracer.isTraceSampled();

      // Assess
      expect(xRayTraceSampled).toBe(false);
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
      }).toThrow(
        'No context available. ns.run() or ns.bind() must be called first.'
      );
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
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(
          () => new Segment('facade', process.env._X_AMZN_TRACE_ID || null)
        );
      const providerSetSegmentSpy = jest
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation(() => ({}));

      // Act
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '## foo.bar'
      );
      tracer.setSegment(newSubsegment);

      // Assess
      expect(providerSetSegmentSpy).toBeCalledTimes(1);
      expect(providerSetSegmentSpy).toBeCalledWith(
        expect.objectContaining({
          id: newSubsegment.id,
          name: newSubsegment.name,
        })
      );
    });
  });

  describe('Method: putAnnotation', () => {
    test('when called while tracing is disabled, it does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putAnnotationSpy = jest.spyOn(tracer.provider, 'putAnnotation');

      // Act
      tracer.putAnnotation('foo', 'bar');

      // Assess
      expect(putAnnotationSpy).toBeCalledTimes(0);
    });

    test('it calls the provider method with the correct arguments', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const putAnnotationSpy = jest.spyOn(tracer.provider, 'putAnnotation');

      // Act
      tracer.putAnnotation('foo', 'bar');

      // Assess
      expect(putAnnotationSpy).toBeCalledTimes(1);
      expect(putAnnotationSpy).toBeCalledWith('foo', 'bar');
    });
  });

  describe('Method: putMetadata', () => {
    test('when tracing is disabled, it does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putMetadataSpy = jest.spyOn(tracer.provider, 'putMetadata');

      // Act
      tracer.putMetadata('foo', 'bar');

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(0);
    });

    test('it calls the provider method with the correct arguments', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = jest.spyOn(tracer.provider, 'putMetadata');

      // Act
      tracer.putMetadata('foo', 'bar');

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(1);
      // The default namespace is 'hello-world' and it comes from the service name environment variable
      expect(putMetadataSpy).toBeCalledWith('foo', 'bar', 'hello-world');
    });

    test('when passed a custom namespace, it calls the provider method with the correct arguments', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = jest.spyOn(tracer.provider, 'putMetadata');

      // Act
      tracer.putMetadata('foo', 'bar', 'baz');

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(1);
      expect(putMetadataSpy).toBeCalledWith('foo', 'bar', 'baz');
    });

    test('when a custom namespace was set in the constructor, it calls the provider method with the correct arguments', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ serviceName: 'baz' });
      const putMetadataSpy = jest.spyOn(tracer.provider, 'putMetadata');

      // Act
      tracer.putMetadata('foo', 'bar');

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(1);
      expect(putMetadataSpy).toBeCalledWith('foo', 'bar', 'baz');
    });
  });

  describe('Method: captureLambdaHandler', () => {
    test('when used as decorator while tracing is disabled, it does nothing', async () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(
          () => new Segment('facade', process.env._X_AMZN_TRACE_ID || null)
        );
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler()
        public handler(
          _event: unknown,
          _context: Context,
          callback: Callback<unknown>
        ): void {
          callback(null, {
            foo: 'bar',
          });
        }
      }

      // Act
      new Lambda().handler(event, context, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(0);
    });

    test('when used as decorator while POWERTOOLS_TRACER_CAPTURE_RESPONSE is set to false, it does not capture the response as metadata', async () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      const putMetadataSpy = jest.spyOn(tracer, 'putMetadata');

      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler()
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>
        ): void | Promise<TResult> {
          return new Promise((resolve, _reject) =>
            resolve({
              foo: 'bar',
            } as unknown as TResult)
          );
        }
      }

      // Act
      await new Lambda().handler(event, context, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(putMetadataSpy).toHaveBeenCalledTimes(0);
      delete process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE;
    });

    test('when used as decorator while captureResponse is set to false, it does not capture the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      const addResponseAsMetadataSpy = jest.spyOn(
        tracer,
        'addResponseAsMetadata'
      );

      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler({ captureResponse: false })
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>
        ): void | Promise<TResult> {
          return new Promise((resolve, _reject) =>
            resolve({
              foo: 'bar',
            } as unknown as TResult)
          );
        }
      }

      // Act
      await new Lambda().handler(event, context, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(addResponseAsMetadataSpy).toHaveBeenCalledTimes(0);
    });

    test('when used as decorator while captureResponse is set to true, it captures the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      const addResponseAsMetadataSpy = jest.spyOn(
        tracer,
        'addResponseAsMetadata'
      );

      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler({ captureResponse: true })
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>
        ): void | Promise<TResult> {
          return new Promise((resolve, _reject) =>
            resolve({
              foo: 'bar',
            } as unknown as TResult)
          );
        }
      }

      // Act
      await new Lambda().handler(event, context, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '## index.handler',
        expect.anything()
      );
      expect(addResponseAsMetadataSpy).toHaveBeenCalledTimes(1);
      expect(addResponseAsMetadataSpy).toHaveBeenCalledWith(
        { foo: 'bar' },
        'index.handler'
      );
    });

    test('when used as decorator and with standard config, it captures the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      const addResponseAsMetadataSpy = jest.spyOn(
        tracer,
        'addResponseAsMetadata'
      );

      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler()
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>
        ): void | Promise<TResult> {
          return new Promise((resolve, _reject) =>
            resolve({
              foo: 'bar',
            } as unknown as TResult)
          );
        }
      }

      // Act
      await new Lambda().handler(event, context, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '## index.handler',
        expect.anything()
      );
      expect(addResponseAsMetadataSpy).toHaveBeenCalledTimes(1);
      expect(addResponseAsMetadataSpy).toHaveBeenCalledWith(
        { foo: 'bar' },
        'index.handler'
      );
    });

    test('when used as decorator while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false, it does not capture the exceptions', async () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      const newSubsegment = new Subsegment('### dummyMethod');
      jest.spyOn(tracer, 'getSegment').mockImplementation(() => newSubsegment);
      const addErrorFlagSpy = jest.spyOn(newSubsegment, 'addErrorFlag');
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');

      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler()
        public handler(
          _event: unknown,
          _context: Context,
          _callback: Callback<void>
        ): void {
          throw new Error('Exception thrown!');
        }
      }
      const lambda = new Lambda();

      // Act & Assess
      expect(
        lambda.handler({}, context, () => console.log('Lambda invoked!'))
      ).rejects.toThrowError(Error);
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(addErrorFlagSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledTimes(0);
      expect.assertions(4);

      delete process.env.POWERTOOLS_TRACER_CAPTURE_ERROR;
    });

    test('when used as decorator and with standard config, it captures the exception', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      const addErrorAsMetadataSpy = jest.spyOn(tracer, 'addErrorAsMetadata');
      const newSubsegment = new Subsegment('### dummyMethod');
      jest.spyOn(tracer, 'getSegment').mockImplementation(() => newSubsegment);
      const addErrorFlagSpy = jest.spyOn(newSubsegment, 'addErrorFlag');
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');

      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler()
        public handler(
          _event: unknown,
          _context: Context,
          _callback: Callback<void>
        ): void {
          throw new Error('Exception thrown!2');
        }
      }

      // Act & Assess
      const lambda = new Lambda();
      expect(
        lambda.handler({}, context, () => console.log('Lambda invoked!'))
      ).rejects.toThrowError(Error);
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(addErrorAsMetadataSpy).toHaveBeenCalledTimes(1);
      expect(addErrorAsMetadataSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(addErrorFlagSpy).toHaveBeenCalledTimes(0);
      expect(addErrorSpy).toHaveBeenCalledTimes(1);
      expect.assertions(6);
    });

    test('when used as decorator and with standard config, it annotates ColdStart', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = createCaptureAsyncFuncMock(tracer.provider);
      const annotateColdStartSpy = jest.spyOn(tracer, 'annotateColdStart');

      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler()
        public handler(
          _event: unknown,
          _context: Context,
          callback: Callback<{ foo: string }>
        ): void {
          callback(null, { foo: 'bar' });
        }
      }

      // Act
      new Lambda().handler(event, context, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '## index.handler',
        expect.anything()
      );
      expect(annotateColdStartSpy).toHaveBeenCalledTimes(1);
    });

    test('when used as decorator and with standard config, it adds the Service annotation', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = createCaptureAsyncFuncMock(tracer.provider);
      const addServiceNameAnnotationSpy = jest.spyOn(
        tracer,
        'addServiceNameAnnotation'
      );

      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler()
        public handler(
          _event: unknown,
          _context: Context,
          callback: Callback<{ foo: string }>
        ): void {
          callback(null, {
            foo: 'bar',
          });
        }
      }

      // Act
      new Lambda().handler(event, context, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '## index.handler',
        expect.anything()
      );
      // The first call is for the Cold Start annotation
      expect(addServiceNameAnnotationSpy).toHaveBeenCalledTimes(1);
    });

    test('when used as decorator and when calling the handler, it has access to member variables', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);

      class Lambda implements LambdaInterface {
        private readonly memberVariable: string;

        public constructor(memberVariable: string) {
          this.memberVariable = memberVariable;
        }

        @tracer.captureLambdaHandler()
        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return `memberVariable:${this.memberVariable}`;
        }
      }

      // Act / Assess
      const lambda = new Lambda('someValue');
      const handler = lambda.handler.bind(lambda);
      expect(await handler({}, context)).toEqual('memberVariable:someValue');
    });

    test('when used as decorator on an async method, the method is awaited correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );

      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const subsegmentCloseSpy = jest
        .spyOn(newSubsegment, 'close')
        .mockImplementation();
      createCaptureAsyncFuncMock(tracer.provider, newSubsegment);

      class Lambda implements LambdaInterface {
        public async dummyMethod(): Promise<void> {
          return;
        }

        @tracer.captureLambdaHandler()
        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<void> {
          await this.dummyMethod();
          this.otherDummyMethod();

          return;
        }

        public otherDummyMethod(): void {
          return;
        }
      }

      // Act
      const lambda = new Lambda();
      const otherDummyMethodSpy = jest
        .spyOn(lambda, 'otherDummyMethod')
        .mockImplementation();
      const handler = lambda.handler.bind(lambda);
      await handler({}, context);

      // Assess
      // Here we assert that the otherDummyMethodSpy method is called before the cleanup logic (inside the finally of decorator)
      // that should always be called after the handler has returned. If otherDummyMethodSpy is called after it means the
      // decorator is NOT awaiting the handler which would cause the test to fail.
      const dummyCallOrder = subsegmentCloseSpy.mock.invocationCallOrder[0];
      const otherDummyCallOrder =
        otherDummyMethodSpy.mock.invocationCallOrder[0];
      expect(otherDummyCallOrder).toBeLessThan(dummyCallOrder);
    });

    it('catches the error and logs a warning when a segment fails to close/serialize', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const handlerSubsegment: Segment | Subsegment | undefined =
        new Subsegment('### dummyMethod');
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => handlerSubsegment);
      setContextMissingStrategy(() => null);
      jest
        .spyOn(tracer.provider, 'captureAsyncFunc')
        .mockImplementation(async (methodName, callBackFn) => {
          await callBackFn(handlerSubsegment);
        });
      const logWarningSpy = jest.spyOn(console, 'warn');
      const closeSpy = jest
        .spyOn(handlerSubsegment, 'close')
        .mockImplementation(() => {
          throw new Error('dummy error');
        });

      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler()
        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return 'foo bar';
        }
      }

      // Act
      await new Lambda().handler(event, context);

      // Assess
      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(logWarningSpy).toHaveBeenNthCalledWith(
        1,
        `Failed to close or serialize segment %s. We are catching the error but data might be lost.`,
        handlerSubsegment.name,
        new Error('dummy error')
      );
    });
  });

  describe('Method: captureMethod', () => {
    test('when called while tracing is disabled, it does nothing', async () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      class Lambda implements LambdaInterface {
        @tracer.captureMethod()
        public async dummyMethod(some: string): Promise<string> {
          return some;
        }

        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return await this.dummyMethod('foo bar');
        }
      }

      // Act
      await new Lambda().handler(event, context);

      // Assess
      expect(captureAsyncFuncSpy).toBeCalledTimes(0);
    });

    test('when used as decorator and with standard config, it captures the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      const addResponseAsMetadataSpy = jest.spyOn(
        tracer,
        'addResponseAsMetadata'
      );

      class Lambda implements LambdaInterface {
        @tracer.captureMethod()
        public async dummyMethod(some: string): Promise<string> {
          return some;
        }

        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return await this.dummyMethod('foo bar');
        }
      }

      // Act
      await new Lambda().handler(event, context);

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '### dummyMethod',
        expect.anything()
      );
      expect(addResponseAsMetadataSpy).toHaveBeenCalledTimes(1);
      expect(addResponseAsMetadataSpy).toHaveBeenCalledWith(
        'foo bar',
        'dummyMethod'
      );
    });

    test('when used as decorator and with captureResponse set to false, it does not capture the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      const addResponseAsMetadataSpy = jest.spyOn(
        tracer,
        'addResponseAsMetadata'
      );

      class Lambda implements LambdaInterface {
        @tracer.captureMethod({ captureResponse: false })
        public async dummyMethod(some: string): Promise<string> {
          return some;
        }

        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return await this.dummyMethod('foo bar');
        }
      }

      // Act
      await new Lambda().handler(event, context);

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '### dummyMethod',
        expect.anything()
      );
      expect(addResponseAsMetadataSpy).toHaveBeenCalledTimes(0);
    });

    test('when used as decorator and with captureResponse set to true, it does captures the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      const addResponseAsMetadataSpy = jest.spyOn(
        tracer,
        'addResponseAsMetadata'
      );

      class Lambda implements LambdaInterface {
        @tracer.captureMethod()
        public async dummyMethod(some: string): Promise<string> {
          return some;
        }

        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return await this.dummyMethod('foo bar');
        }
      }

      // Act
      await new Lambda().handler(event, context);

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '### dummyMethod',
        expect.anything()
      );
      expect(addResponseAsMetadataSpy).toHaveBeenCalledTimes(1);
    });

    test('when used as decorator and with standard config, it captures the exception correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = createCaptureAsyncFuncMock(tracer.provider);
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
      class Lambda implements LambdaInterface {
        @tracer.captureMethod()
        public async dummyMethod(_some: string): Promise<string> {
          throw new Error('Exception thrown!');
        }

        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return await this.dummyMethod('foo bar');
        }
      }

      // Act / Assess
      await expect(new Lambda().handler({}, context)).rejects.toThrowError(
        Error
      );
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(newSubsegment).toEqual(
        expect.objectContaining({
          name: '### dummyMethod',
        })
      );
      expect('cause' in newSubsegment).toBe(true);
      expect(addErrorSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledWith(
        new Error('Exception thrown!'),
        false
      );
      expect.assertions(6);
    });

    test('when used as decorator and when calling other methods/props in the class they are called in the orginal scope', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);

      class Lambda implements LambdaInterface {
        @tracer.captureMethod()
        public async dummyMethod(): Promise<string> {
          return `otherMethod:${this.otherMethod()}`;
        }

        @tracer.captureLambdaHandler()
        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return await this.dummyMethod();
        }

        public otherMethod(): string {
          return 'otherMethod';
        }
      }

      // Act / Assess
      expect(await new Lambda().handler({}, context)).toEqual(
        'otherMethod:otherMethod'
      );
    });

    test('when used as decorator and when calling a method in the class, it has access to member variables', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);

      class Lambda implements LambdaInterface {
        private readonly memberVariable: string;

        public constructor(memberVariable: string) {
          this.memberVariable = memberVariable;
        }

        @tracer.captureMethod()
        public async dummyMethod(): Promise<string> {
          return `memberVariable:${this.memberVariable}`;
        }

        @tracer.captureLambdaHandler()
        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return await this.dummyMethod();
        }
      }

      // Act / Assess
      const lambda = new Lambda('someValue');
      expect(await lambda.dummyMethod()).toEqual('memberVariable:someValue');
    });

    test('when used as decorator on an async method, the method is awaited correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );

      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const subsegmentCloseSpy = jest
        .spyOn(newSubsegment, 'close')
        .mockImplementation();
      createCaptureAsyncFuncMock(tracer.provider, newSubsegment);

      class Lambda implements LambdaInterface {
        @tracer.captureMethod()
        public async dummyMethod(): Promise<void> {
          return;
        }

        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<void> {
          await this.dummyMethod();
          this.otherDummyMethod();

          return;
        }

        public otherDummyMethod(): void {
          return;
        }
      }

      // Act
      const lambda = new Lambda();
      const otherDummyMethodSpy = jest
        .spyOn(lambda, 'otherDummyMethod')
        .mockImplementation();
      const handler = lambda.handler.bind(lambda);
      await handler({}, context);

      // Here we assert that the subsegment.close() (inside the finally of decorator) is called before the other otherDummyMethodSpy method
      // that should always be called after the handler has returned. If subsegment.close() is called after it means the
      // decorator is NOT awaiting the method which would cause the test to fail.
      const dummyCallOrder = subsegmentCloseSpy.mock.invocationCallOrder[0];
      const otherDummyCallOrder =
        otherDummyMethodSpy.mock.invocationCallOrder[0];
      expect(dummyCallOrder).toBeLessThan(otherDummyCallOrder);
    });

    test('when used as decorator together with another external decorator, the method name is detected properly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );

      // Creating custom external decorator
      // eslint-disable-next-line func-style
      function passThrough() {
        // A decorator that calls the original method.
        return (
          _target: unknown,
          _propertyKey: string,
          descriptor: PropertyDescriptor
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const originalMethod = descriptor.value!;
          descriptor.value = function (...args: unknown[]) {
            return originalMethod.apply(this, [...args]);
          };
        };
      }

      class Lambda implements LambdaInterface {
        @tracer.captureMethod()
        @passThrough()
        public async dummyMethod(): Promise<string> {
          return `foo`;
        }

        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<void> {
          await this.dummyMethod();

          return;
        }
      }

      // Act / Assess
      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);
      await handler({}, context);

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '### dummyMethod',
        expect.any(Function)
      );
    });

    test('when used as decorator and with a custom subSegmentName, it sets the correct name for the subsegment', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );
      jest.spyOn(newSubsegment, 'flush').mockImplementation(() => null);
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = jest.spyOn(
        tracer.provider,
        'captureAsyncFunc'
      );
      class Lambda implements LambdaInterface {
        @tracer.captureMethod({ subSegmentName: '#### myCustomMethod' })
        public async dummyMethod(some: string): Promise<string> {
          return some;
        }

        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return await this.dummyMethod('foo bar');
        }
      }

      // Act
      await new Lambda().handler(event, context);

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '#### myCustomMethod',
        expect.anything()
      );
    });

    it('catches the error and logs a warning when a segment fails to close/serialize', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const handlerSubsegment: Segment | Subsegment | undefined =
        new Subsegment('### dummyMethod');
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => handlerSubsegment);
      setContextMissingStrategy(() => null);
      jest
        .spyOn(tracer.provider, 'captureAsyncFunc')
        .mockImplementation(async (methodName, callBackFn) => {
          await callBackFn(handlerSubsegment);
        });
      const logWarningSpy = jest.spyOn(console, 'warn');
      const closeSpy = jest
        .spyOn(handlerSubsegment, 'close')
        .mockImplementation(() => {
          throw new Error('dummy error');
        });

      class Lambda implements LambdaInterface {
        @tracer.captureMethod()
        public async dummyMethod(some: string): Promise<string> {
          return some;
        }

        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          return await this.dummyMethod('foo bar');
        }
      }

      // Act
      await new Lambda().handler(event, context);

      // Assess
      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(logWarningSpy).toHaveBeenNthCalledWith(
        1,
        `Failed to close or serialize segment %s. We are catching the error but data might be lost.`,
        handlerSubsegment.name,
        new Error('dummy error')
      );
    });
  });

  describe('Method: captureAWS', () => {
    test('when called while tracing is disabled, it does nothing', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAWSSpy = jest
        .spyOn(tracer.provider, 'captureAWS')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWS({});

      // Assess
      expect(captureAWSSpy).toBeCalledTimes(0);
    });

    test('when called it returns the decorated object that was passed to it', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSSpy = jest
        .spyOn(tracer.provider, 'captureAWS')
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
      const captureAWSv3ClientSpy = jest
        .spyOn(tracer.provider, 'captureAWSv3Client')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWSv3Client({});

      // Assess
      expect(captureAWSv3ClientSpy).toBeCalledTimes(0);
    });

    test('when called it returns the decorated object that was passed to it', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSv3ClientSpy = jest
        .spyOn(tracer.provider, 'captureAWSv3Client')
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
      const captureAWSClientSpy = jest.spyOn(
        tracer.provider,
        'captureAWSClient'
      );

      // Act
      tracer.captureAWSClient({});

      // Assess
      expect(captureAWSClientSpy).toBeCalledTimes(0);
    });

    test('when called with a base AWS SDK v2 client, it calls the provider method to patch it', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSClientSpy = jest
        .spyOn(tracer.provider, 'captureAWSClient')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWSClient({});

      // Assess
      expect(captureAWSClientSpy).toBeCalledTimes(1);
      expect(captureAWSClientSpy).toBeCalledWith({});
    });

    test('when called with a complex AWS SDK v2 client, it calls the provider method to patch it', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSClientSpy = jest
        .spyOn(tracer.provider, 'captureAWSClient')
        .mockImplementationOnce(() => {
          throw new Error('service.customizeRequests is not a function');
        })
        .mockImplementation(() => null);

      // Act
      // This is the shape of a DocumentClient from the AWS SDK v2
      tracer.captureAWSClient({ service: {} });

      // Assess
      expect(captureAWSClientSpy).toBeCalledTimes(2);
      expect(captureAWSClientSpy).toHaveBeenNthCalledWith(1, { service: {} });
      expect(captureAWSClientSpy).toHaveBeenNthCalledWith(2, {});
    });

    test('when called with an uncompatible object, it throws an error', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSClientSpy = jest.spyOn(
        tracer.provider,
        'captureAWSClient'
      );

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
