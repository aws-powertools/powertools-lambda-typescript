import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import {
  Segment,
  Subsegment,
  setContextMissingStrategy,
} from 'aws-xray-sdk-core';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigServiceInterface } from '../../src/types/ConfigServiceInterface.js';
import type { ProviderServiceInterface } from '../../src/types/ProviderService.js';
import { Tracer } from './../../src/index.js';
import type { CaptureLambdaHandlerOptions } from './../../src/types/index.js';

/* vi.hoisted(() => {
  process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
  process.env.AWS_XRAY_LOGGING_LEVEL = 'silent';
}); */

const createCaptureAsyncFuncMock = (
  provider: ProviderServiceInterface,
  subsegment?: Subsegment
) =>
  vi
    .spyOn(provider, 'captureAsyncFunc')
    .mockImplementation(async (methodName, callBackFn) => {
      const newSubsegment = subsegment || new Subsegment(`### ${methodName}`);
      vi.spyOn(newSubsegment, 'flush').mockImplementation(() => null);
      return await callBackFn(newSubsegment);
    });

describe('Class: Tracer', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const event = {
    foo: 'bar',
    bar: 'baz',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: constructor', () => {
    it('sets the AWS_XRAY_CONTEXT_MISSING environment variable to IGNORE_ERROR when it is not set', () => {
      // We are setting the environment variable as a side effect of importing the module, setting it within the Tracer would
      // require introducing async code to the constructor, which is not a good practice, in order to lazy load the AWS X-Ray SDK for Node.js
      // on demand. Between that option, and setting it as a side effect of importing the module, the latter is the better option.
      expect(process.env.AWS_XRAY_CONTEXT_MISSING).toBe('IGNORE_ERROR');
    });

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
        getSamLocal() {
          return 'false';
        },
        getAwsExecutionEnv() {
          return 'AWS_Lambda_nodejs12.x';
        },
        isDevMode(): boolean {
          return false;
        },
        isValueTrue(value: string): boolean {
          return value === 'true';
        },
        getXrayTraceId() {
          return '1-abcdef12-3456abcdef123456abcdef12';
        },
        getXrayTraceSampled() {
          return false;
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
    it('disables tracing when AWS_EXECUTION_ENV environment variable is equal to AWS_Lambda_amplify-mock', () => {
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

    it('disables tracing when AWS_SAM_LOCAL environment variable is set', () => {
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

    it('leaves tracing enabled when AWS_EXECUTION_ENV environment variable is set', () => {
      // Prepare
      process.env.AWS_EXECUTION_ENV = 'nodejs20.x';

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: true,
        })
      );
    });

    it('disables tracing when AWS_EXECUTION_ENV environment variable is NOT set', () => {
      // Prepare
      process.env.AWS_EXECUTION_ENV = undefined;

      // Act
      const tracer = new Tracer();

      // Assess
      expect(tracer).toEqual(
        expect.objectContaining({
          tracingEnabled: false,
        })
      );
    });

    it('disables tracing when POWERTOOLS_TRACE_ENABLED environment variable is set to false', () => {
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

    it('picks up the service name from the POWERTOOLS_SERVICE_NAME environment variable', () => {
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

    it('configures the capture response feature from the POWERTOOLS_TRACER_CAPTURE_RESPONSE environment variable', () => {
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

    it('ignores invalid values for the POWERTOOLS_TRACER_CAPTURE_RESPONSE environment variable', () => {
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

    it('configures the capture error feature using the POWERTOOLS_TRACER_CAPTURE_ERROR environment variable', () => {
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

    it('ignores invalid POWERTOOLS_TRACER_CAPTURE_ERROR environment variable values', () => {
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

    it('configures the http instrumentation feature using the POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS environment variable', () => {
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

    it('ignores invalid values for the POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS environment variable', () => {
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
    it('does nothing when tracing is disabled', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putAnnotationSpy = vi.spyOn(tracer, 'putAnnotation');

      // Act
      tracer.annotateColdStart();

      // Assess
      expect(putAnnotationSpy).toBeCalledTimes(0);
    });

    it('annotates the cold start only once', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const putAnnotationSpy = vi
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
    it('does nothing when tracing is disabled', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putAnnotation = vi.spyOn(tracer, 'putAnnotation');

      // Act
      tracer.addServiceNameAnnotation();

      // Assess
      expect(putAnnotation).toBeCalledTimes(0);
    });

    it('uses the provided service name when one is set', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ serviceName: 'foo' });
      const putAnnotation = vi
        .spyOn(tracer, 'putAnnotation')
        .mockImplementation(() => null);

      // Act
      tracer.addServiceNameAnnotation();

      // Assess
      expect(putAnnotation).toBeCalledTimes(1);
      expect(putAnnotation).toBeCalledWith('Service', 'foo');
    });

    it('uses the default service name when one is not provided', () => {
      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = undefined;
      const tracer: Tracer = new Tracer();
      const putAnnotation = vi
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
    it('does nothing when tracing is disabled', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

      // Act
      tracer.addResponseAsMetadata({ foo: 'bar' }, context.functionName);

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(0);
    });

    it('does nothing when the feature is disabled via the POWERTOOLS_TRACER_CAPTURE_RESPONSE env variable', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

      // Act
      tracer.addResponseAsMetadata({ foo: 'bar' }, context.functionName);

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(0);
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = undefined;
    });

    it('it does nothing when the response is undefined', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

      // Act
      tracer.addResponseAsMetadata(undefined, context.functionName);

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(0);
    });

    it('calls the underlying provider method correctly', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = vi
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
    it('does nothing when tracing is disabled', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const getSegmentSpy = vi.spyOn(tracer, 'getSegment');

      // Act
      tracer.addErrorAsMetadata(new Error('foo'));

      // Assess
      expect(getSegmentSpy).toBeCalledTimes(0);
    });

    it('does not capture the error when called while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      const subsegment = new Subsegment(`## ${context.functionName}`);
      vi.spyOn(tracer, 'getSegment').mockImplementation(() => subsegment);
      const addErrorFlagSpy = vi.spyOn(subsegment, 'addErrorFlag');
      const addErrorSpy = vi.spyOn(subsegment, 'addError');

      // Act
      tracer.addErrorAsMetadata(new Error('foo'));

      // Assess
      expect(addErrorFlagSpy).toBeCalledTimes(1);
      expect(addErrorSpy).toBeCalledTimes(0);
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = undefined;
    });

    it('calls subsegment.addError correctly when called with default config', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const subsegment = new Subsegment(`## ${context.functionName}`);
      vi.spyOn(tracer, 'getSegment').mockImplementation(() => subsegment);
      const addErrorFlagSpy = vi.spyOn(subsegment, 'addErrorFlag');
      const addErrorSpy = vi.spyOn(subsegment, 'addError');

      // Act
      tracer.addErrorAsMetadata(new Error('foo'));

      // Assess
      expect(addErrorFlagSpy).toBeCalledTimes(0);
      expect(addErrorSpy).toBeCalledTimes(1);
      expect(addErrorSpy).toBeCalledWith(new Error('foo'), false);
    });

    it('returns instead of throwing when called and the segment is not found', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer, 'getSegment').mockImplementation(() => undefined);

      // Act & Assess
      expect(() => tracer.addErrorAsMetadata(new Error('foo'))).not.toThrow();
    });
  });

  describe('Method: getRootXrayTraceId', () => {
    it('returns the X-Ray Trace ID when called', () => {
      // Prepare
      const tracer: Tracer = new Tracer();

      // Act
      const xRayTraceId = tracer.getRootXrayTraceId();

      // Assess
      expect(xRayTraceId).toBe('1-abcdef12-3456abcdef123456abcdef12');
    });
  });

  describe('Method: getSegment', () => {
    it('logs a warning when called and no segment is returned', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => undefined
      );
      vi.spyOn(console, 'warn').mockImplementation(() => null);

      // Act
      tracer.getSegment();

      // Assess
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to get the current sub/segment from the context, this is likely because you are not using the Tracer in a Lambda function.'
      );
    });

    it('returns a dummy segment when called outside of a namespace or without parent segment, and tracing is disabled', () => {
      // Prepare
      process.env.AWS_EXECUTION_ENV = undefined; // This will disable the tracer, simulating local execution
      const tracer: Tracer = new Tracer();

      // Act
      const segment = tracer.getSegment();

      // Assess
      expect(segment).toBeInstanceOf(Subsegment);
      expect((segment as Subsegment).name).toBe('## Dummy segment');
    });

    it('returns the parent segment when called within a namespace', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
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
    it('returns true if the Sampled flag is set', () => {
      // Prepare
      const tracer: Tracer = new Tracer();

      // Act
      const xRayTraceSampled = tracer.isTraceSampled();

      // Assess
      expect(xRayTraceSampled).toBe(false);
    });

    it('returns false when called and Trace is disabled', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });

      // Act
      const xRayTraceSampled = tracer.isTraceSampled();

      // Assess
      expect(xRayTraceSampled).toBe(false);
    });
  });

  describe('Method: setSegment', () => {
    it('throws when called outside of a namespace or without parent segment, and Tracer is enabled', () => {
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

    it('does nothing when called outside of a namespace or without parent segment, and tracing is disabled', () => {
      // Prepare
      process.env.AWS_EXECUTION_ENV = undefined; // This will disable the tracer, simulating local execution
      const tracer: Tracer = new Tracer();
      const setSegmentSpy = vi.spyOn(tracer.provider, 'setSegment');

      // Act
      const newSubsegment = new Subsegment('## foo.bar');
      tracer.setSegment(newSubsegment);

      // Assess
      expect(setSegmentSpy).toBeCalledTimes(0);
    });

    it('sets the segment as active when called', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => new Segment('facade', process.env._X_AMZN_TRACE_ID || null)
      );
      const providerSetSegmentSpy = vi
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
    it('does nothing when tracing is disabled', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putAnnotationSpy = vi.spyOn(tracer.provider, 'putAnnotation');

      // Act
      tracer.putAnnotation('foo', 'bar');

      // Assess
      expect(putAnnotationSpy).toBeCalledTimes(0);
    });

    it('calls the provider method with the correct arguments', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const putAnnotationSpy = vi.spyOn(tracer.provider, 'putAnnotation');

      // Act
      tracer.putAnnotation('foo', 'bar');

      // Assess
      expect(putAnnotationSpy).toBeCalledTimes(1);
      expect(putAnnotationSpy).toBeCalledWith('foo', 'bar');
    });
  });

  describe('Method: putMetadata', () => {
    it('does nothing when tracing is disabled', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const putMetadataSpy = vi.spyOn(tracer.provider, 'putMetadata');

      // Act
      tracer.putMetadata('foo', 'bar');

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(0);
    });

    it('calls the provider method with the correct arguments', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = vi.spyOn(tracer.provider, 'putMetadata');

      // Act
      tracer.putMetadata('foo', 'bar');

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(1);
      // The default namespace is 'hello-world' and it comes from the service name environment variable
      expect(putMetadataSpy).toBeCalledWith('foo', 'bar', 'hello-world');
    });

    it('calls the provider method with the correct arguments when a custom namespace is passed directly', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const putMetadataSpy = vi.spyOn(tracer.provider, 'putMetadata');

      // Act
      tracer.putMetadata('foo', 'bar', 'baz');

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(1);
      expect(putMetadataSpy).toBeCalledWith('foo', 'bar', 'baz');
    });

    it('calls the provider method with the correct arguments when the namespace is inferred by the service name', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ serviceName: 'baz' });
      const putMetadataSpy = vi.spyOn(tracer.provider, 'putMetadata');

      // Act
      tracer.putMetadata('foo', 'bar');

      // Assess
      expect(putMetadataSpy).toBeCalledTimes(1);
      expect(putMetadataSpy).toBeCalledWith('foo', 'bar', 'baz');
    });
  });

  describe('Method: captureLambdaHandler', () => {
    const getLambdaClass = (
      tracer: Tracer,
      options?: {
        shouldThrow?: boolean;
        tracerOptions?: CaptureLambdaHandlerOptions;
      }
    ) => {
      class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler(options?.tracerOptions)
        public handler<TEvent, TResult>(_event: TEvent, _context: Context) {
          if (options?.shouldThrow) throw new Error('An error has occurred');
          return new Promise((resolve, _reject) =>
            resolve({
              foo: 'bar',
            } as unknown as TResult)
          );
        }
      }

      return new Lambda();
    };

    it('does nothing when tracing is disabled', async () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => new Segment('facade', process.env._X_AMZN_TRACE_ID || null)
      );
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
      const lambda = getLambdaClass(tracer);

      // Act
      await lambda.handler(event, context);

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(0);
    });

    it('does not capture the response as metadata when the feature is disabled', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
      const addResponseAsMetadataSpy = vi.spyOn(
        tracer,
        'addResponseAsMetadata'
      );
      const lambda = getLambdaClass(tracer, {
        tracerOptions: { captureResponse: false },
      });

      // Act
      await lambda.handler(event, context);

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(addResponseAsMetadataSpy).toHaveBeenCalledTimes(0);
    });

    it('captures the response as metadata by default', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
      const addResponseAsMetadataSpy = vi.spyOn(
        tracer,
        'addResponseAsMetadata'
      );
      const lambda = getLambdaClass(tracer);

      // Act
      await lambda.handler(event, context);

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

    it('does not capture exceptions when the feature is disabled', async () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
      const newSubsegment = new Subsegment('### dummyMethod');
      vi.spyOn(tracer, 'getSegment').mockImplementation(() => newSubsegment);
      const addErrorFlagSpy = vi.spyOn(newSubsegment, 'addErrorFlag');
      const addErrorSpy = vi.spyOn(newSubsegment, 'addError');
      const lambda = getLambdaClass(tracer, { shouldThrow: true });

      // Act & Assess
      expect(lambda.handler({}, context)).rejects.toThrow(Error);
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(addErrorFlagSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledTimes(0);
      expect.assertions(4);

      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = undefined;
    });

    it('captures exceptions as metadata by default', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
      const addErrorAsMetadataSpy = vi.spyOn(tracer, 'addErrorAsMetadata');
      const newSubsegment = new Subsegment('### dummyMethod');
      vi.spyOn(tracer, 'getSegment').mockImplementation(() => newSubsegment);
      const addErrorFlagSpy = vi.spyOn(newSubsegment, 'addErrorFlag');
      const addErrorSpy = vi.spyOn(newSubsegment, 'addError');
      const lambda = getLambdaClass(tracer, { shouldThrow: true });

      // Act & Assess
      expect(lambda.handler({}, context)).rejects.toThrow(Error);
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(addErrorAsMetadataSpy).toHaveBeenCalledTimes(1);
      expect(addErrorAsMetadataSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(addErrorFlagSpy).toHaveBeenCalledTimes(0);
      expect(addErrorSpy).toHaveBeenCalledTimes(1);
      expect.assertions(6);
    });

    it('adds the ColdStart annotation', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = createCaptureAsyncFuncMock(tracer.provider);
      const annotateColdStartSpy = vi.spyOn(tracer, 'annotateColdStart');
      const lambda = getLambdaClass(tracer);

      // Act
      lambda.handler(event, context);

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '## index.handler',
        expect.anything()
      );
      expect(annotateColdStartSpy).toHaveBeenCalledTimes(1);
    });

    it('adds the Service annotation', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = createCaptureAsyncFuncMock(tracer.provider);
      const addServiceNameAnnotationSpy = vi.spyOn(
        tracer,
        'addServiceNameAnnotation'
      );
      const lambda = getLambdaClass(tracer);

      // Act
      await lambda.handler(event, context);

      // Assess
      expect(captureAsyncFuncSpy).toHaveBeenCalledTimes(1);
      expect(captureAsyncFuncSpy).toHaveBeenCalledWith(
        '## index.handler',
        expect.anything()
      );
      // The first call is for the Cold Start annotation
      expect(addServiceNameAnnotationSpy).toHaveBeenCalledTimes(1);
    });

    it('awaits async methods correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );

      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => newSubsegment
      );
      setContextMissingStrategy(() => null);
      const subsegmentCloseSpy = vi
        .spyOn(newSubsegment, 'close')
        .mockImplementation(() => null);
      createCaptureAsyncFuncMock(tracer.provider, newSubsegment);

      class Lambda implements LambdaInterface {
        private memberVariable: string;

        public constructor(memberVariable: string) {
          this.memberVariable = memberVariable;
        }

        public async dummyMethod(): Promise<string> {
          return this.memberVariable;
        }

        @tracer.captureLambdaHandler()
        public async handler(
          _event: unknown,
          _context: Context
        ): Promise<string> {
          const result = await this.dummyMethod();
          this.otherDummyMethod();

          return result;
        }

        public otherDummyMethod(): void {
          return;
        }
      }
      const lambda = new Lambda('someValue');
      const otherDummyMethodSpy = vi.spyOn(lambda, 'otherDummyMethod');

      // Act
      const handler = lambda.handler.bind(lambda);
      const result = await handler({}, context);

      // Assess
      expect(result).toEqual('someValue');
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
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => handlerSubsegment
      );
      setContextMissingStrategy(() => null);
      vi.spyOn(tracer.provider, 'captureAsyncFunc').mockImplementation(
        async (methodName, callBackFn) => {
          await callBackFn(handlerSubsegment);
        }
      );
      const logWarningSpy = vi.spyOn(console, 'warn');
      const closeSpy = vi
        .spyOn(handlerSubsegment, 'close')
        .mockImplementation(() => {
          throw new Error('dummy error');
        });
      const lambda = getLambdaClass(tracer);

      // Act
      await lambda.handler(event, context);

      // Assess
      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(logWarningSpy).toHaveBeenNthCalledWith(
        1,
        'Failed to close or serialize segment %s. We are catching the error but data might be lost.',
        handlerSubsegment.name,
        new Error('dummy error')
      );
    });
  });

  describe('Method: captureMethod', () => {
    it('does nothing when tracing is disabled', async () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
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

    it('captures the response as metdata by default', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
      const addResponseAsMetadataSpy = vi.spyOn(
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

    it('does not capture the response as metadata when the feature is disabled', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
      const addResponseAsMetadataSpy = vi.spyOn(
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

    it('captures the response as methadata when the feature is enabled', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
      const addResponseAsMetadataSpy = vi.spyOn(
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

    it('captures the exception correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => newSubsegment
      );
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = createCaptureAsyncFuncMock(tracer.provider);
      const addErrorSpy = vi.spyOn(newSubsegment, 'addError');
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

    it('preserves the this scope correctly when used as decorator', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => newSubsegment
      );
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

    it('awaits the async method correctly when used as decorator', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );

      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => newSubsegment
      );
      setContextMissingStrategy(() => null);
      const subsegmentCloseSpy = vi
        .spyOn(newSubsegment, 'close')
        .mockImplementation(() => null);
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
      const otherDummyMethodSpy = vi.spyOn(lambda, 'otherDummyMethod');
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

    it('detects the method name correctly when used as decorator together with another external decorator', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');

      function passThrough() {
        // A decorator that calls the original method.
        return (
          _target: unknown,
          _propertyKey: string,
          descriptor: PropertyDescriptor
        ) => {
          // biome-ignore lint/style/noNonNullAssertion: we know it's defined because this is a method decorator
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
          return 'foo';
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

    it('sets the correct name for the subsegment when used as decorator and with a custom subSegmentName', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '### dummyMethod'
      );
      vi.spyOn(newSubsegment, 'flush').mockImplementation(() => null);
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => newSubsegment
      );
      setContextMissingStrategy(() => null);
      const captureAsyncFuncSpy = vi.spyOn(tracer.provider, 'captureAsyncFunc');
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
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => handlerSubsegment
      );
      setContextMissingStrategy(() => null);
      vi.spyOn(tracer.provider, 'captureAsyncFunc').mockImplementation(
        async (methodName, callBackFn) => {
          await callBackFn(handlerSubsegment);
        }
      );
      const logWarningSpy = vi.spyOn(console, 'warn');
      const closeSpy = vi
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
        'Failed to close or serialize segment %s. We are catching the error but data might be lost.',
        handlerSubsegment.name,
        new Error('dummy error')
      );
    });
  });

  describe('Method: captureAWS', () => {
    it('does nothing when called while tracing is disabled', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAWSSpy = vi
        .spyOn(tracer.provider, 'captureAWS')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWS({});

      // Assess
      expect(captureAWSSpy).toBeCalledTimes(0);
    });

    it('returns the decorated object that was passed to it', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSSpy = vi
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
    it('does nothing when tracing is disabled', () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const captureAWSv3ClientSpy = vi
        .spyOn(tracer.provider, 'captureAWSv3Client')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWSv3Client({});

      // Assess
      expect(captureAWSv3ClientSpy).toBeCalledTimes(0);
    });

    it('returns the decorated object that was passed to it', () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const captureAWSv3ClientSpy = vi
        .spyOn(tracer.provider, 'captureAWSv3Client')
        .mockImplementation(() => null);

      // Act
      tracer.captureAWSv3Client({});

      // Assess
      expect(captureAWSv3ClientSpy).toBeCalledTimes(1);
      expect(captureAWSv3ClientSpy).toBeCalledWith({});
    });
  });
});
