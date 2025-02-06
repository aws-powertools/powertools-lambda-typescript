/**
 * If the AWS_XRAY_CONTEXT_MISSING environment variable is not set, we set it to IGNORE_ERROR.
 *
 * This is to prevent the AWS X-Ray SDK from logging errors when using top-level await features that make HTTP requests.
 * For example, when using the Parameters utility to fetch parameters during the initialization of the Lambda handler - See #2046
 */
if (
  process.env.AWS_XRAY_CONTEXT_MISSING === '' ||
  process.env.AWS_XRAY_CONTEXT_MISSING === undefined
) {
  process.env.AWS_XRAY_CONTEXT_MISSING = 'IGNORE_ERROR';
}
import { Utility } from '@aws-lambda-powertools/commons';
import type {
  AsyncHandler,
  HandlerMethodDecorator,
  SyncHandler,
} from '@aws-lambda-powertools/commons/types';
import type { Handler } from 'aws-lambda';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';
import xraySdk from 'aws-xray-sdk-core';
import {
  type EnvironmentVariablesService,
  environmentVariablesService,
} from './config/EnvironmentVariablesService.js';
import { ProviderService } from './provider/ProviderService.js';
import type { ConfigServiceInterface } from './types/ConfigServiceInterface.js';
import type { ProviderServiceInterface } from './types/ProviderService.js';
import type {
  AnyClass,
  CaptureLambdaHandlerOptions,
  CaptureMethodOptions,
  MethodDecorator,
  TracerInterface,
  TracerOptions,
} from './types/Tracer.js';
const { Subsegment: XraySubsegment } = xraySdk;

/**
 * ## Intro
 * Tracer is an opinionated thin wrapper for [AWS X-Ray SDK for Node.js](https://github.com/aws/aws-xray-sdk-node).
 *
 * Tracing data can be visualized through AWS X-Ray Console.
 *
 * ## Key features
 *   * Auto capture cold start as annotation, and responses or full exceptions as metadata
 *   * Auto-disable when not running in AWS Lambda environment
 *   * Automatically trace HTTP(s) clients and generate segments for each request
 *   * Support tracing functions via decorators, middleware, and manual instrumentation
 *   * Support tracing AWS SDK v2 and v3 via AWS X-Ray SDK for Node.js
 *
 * ## Usage
 *
 * For more usage examples, see [our documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/core/tracer/).
 *
 * ### Functions usage with middleware
 *
 * If you use function-based Lambda handlers you can use the {@link Tracer.captureLambdaHandler} middy middleware to automatically:
 * * handle the subsegment lifecycle
 * * add the `ServiceName` and `ColdStart` annotations
 * * add the function response as metadata
 * * add the function error as metadata (if any)
 *
 * @example
 * ```typescript
 * import { Tracer } from '@aws-lambda-powertools/tracer';
 * import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
 * import middy from '@middy/core';
 *
 * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
 *
 * const lambdaHandler = async (_event: unknown, _context: unknown) => {
 *   ...
 * };
 *
 * export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
 * ```
 *
 * ### Object oriented usage with decorators
 *
 * If instead you use TypeScript Classes to wrap your Lambda handler you can use the {@link Tracer.captureLambdaHandler} decorator to automatically:
 * * handle the subsegment lifecycle
 * * add the `ServiceName` and `ColdStart` annotations
 * * add the function response as metadata
 * * add the function error as metadata (if any)
 *
 * @example
 * ```typescript
 * import { Tracer } from '@aws-lambda-powertools/tracer';
 * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
 *
 * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
 *
 * class Lambda implements LambdaInterface {
 *   ⁣@tracer.captureLambdaHandler()
 *   public handler(_event: unknown, _context: unknown) {
 *     ...
 *   }
 * }
 *
 * const handlerClass = new Lambda();
 * export const handler = handlerClass.handler.bind(handlerClass);
 * ```
 *
 * ### Functions usage with manual instrumentation
 *
 * If you prefer to manually instrument your Lambda handler you can use the methods in the tracer class directly.
 *
 * @example
 * ```typescript
 * import { Tracer } from '@aws-lambda-powertools/tracer';
 *
 * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
 *
 * export const handler = async (_event: unknown, _context: unknown) => {
 *   const segment = tracer.getSegment(); // This is the facade segment (the one that is created by AWS Lambda)
 *   // Create subsegment for the function & set it as active
 *   const subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
 *   tracer.setSegment(subsegment);
 *
 *   // Annotate the subsegment with the cold start & serviceName
 *   tracer.annotateColdStart();
 *   tracer.addServiceNameAnnotation();
 *
 *   let res;
 *   try {
 *       // ... your own logic goes here
 *       // Add the response as metadata
 *       tracer.addResponseAsMetadata(res, process.env._HANDLER);
 *   } catch (err) {
 *       // Add the error as metadata
 *       tracer.addErrorAsMetadata(err as Error);
 *       throw err;
 *   } finally {
 *       // Close the subsegment
 *       subsegment.close();
 *       // Set the facade segment as active again
 *       tracer.setSegment(segment);
 *   }
 *
 *   return res;
 * }
 * ```
 */
class Tracer extends Utility implements TracerInterface {
  /**
   * The provider service interface used by the Tracer.
   * This interface defines the methods and properties that a provider service must implement.
   */
  public provider: ProviderServiceInterface;

  /**
   * Flag indicating whether to capture errors.
   * This is used to determine if errors should be added to the trace as metadata.
   *
   * @default true
   */
  private captureError = true;
  /**
   * Flag indicating whether to capture HTTP(s) requests.
   * @default true
   */
  private captureHTTPsRequests = true;
  /**
   * Flag indicating whether to capture response data.
   * @default true
   */
  private captureResponse = true;
  /**
   * The custom configuration service used by the Tracer.
   */
  private customConfigService?: ConfigServiceInterface;

  /**
   * The environment variables service used by the Tracer, is always initialized in the constructor in setOptions().
   */
  private envVarsService!: EnvironmentVariablesService;

  // serviceName is always initialized in the constructor in setOptions()
  /**
   * The name of the service, is always initialized in the constructor in setOptions().
   */
  private serviceName!: string;
  /**
   * Flag indicating whether tracing is enabled.
   * @default true
   */
  private tracingEnabled = true;

  public constructor(options: TracerOptions = {}) {
    super();

    this.setOptions(options);
    this.provider = new ProviderService();
    if (this.isTracingEnabled() && this.captureHTTPsRequests) {
      this.provider.captureHTTPsGlobal();
      this.provider.instrumentFetch();
    }
    if (!this.isTracingEnabled()) {
      // Tell x-ray-sdk to not throw an error if context is missing but tracing is disabled
      this.provider.setContextMissingStrategy(() => ({}));
    }
  }

  /**
   * Add an error to the current segment or subsegment as metadata.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-errors
   *
   * @param error - Error to serialize as metadata
   * @param [remote] - Whether the error was thrown by a remote service. Defaults to `false`
   */
  public addErrorAsMetadata(error: Error, remote?: boolean): void {
    if (!this.isTracingEnabled()) {
      return;
    }

    const subsegment = this.getSegment();
    if (subsegment === undefined) {
      return;
    }

    if (!this.captureError) {
      subsegment.addErrorFlag();

      return;
    }

    subsegment.addError(error, remote || false);
  }

  /**
   * Add response data to the current segment or subsegment as metadata.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-annotations
   *
   * @param data - Data to serialize as metadata
   * @param methodName - Name of the method that is being traced
   */
  public addResponseAsMetadata(data?: unknown, methodName?: string): void {
    if (
      data === undefined ||
      !this.captureResponse ||
      !this.isTracingEnabled()
    ) {
      return;
    }

    this.putMetadata(`${methodName} response`, data);
  }

  /**
   * Add service name to the current segment or subsegment as annotation.
   */
  public addServiceNameAnnotation(): void {
    if (!this.isTracingEnabled()) {
      return;
    }
    this.putAnnotation('Service', this.serviceName);
  }

  /**
   * Add ColdStart annotation to the current segment or subsegment.
   *
   * If Tracer has been initialized outside the Lambda handler then the same instance
   * of Tracer will be reused throughout the lifecycle of that same Lambda execution environment
   * and this method will annotate `ColdStart: false` after the first invocation.
   *
   * @see https://docs.aws.amazon.com/lambda/latest/dg/runtimes-context.html
   */
  public annotateColdStart(): void {
    if (this.isTracingEnabled()) {
      this.putAnnotation('ColdStart', this.getColdStart());
    }
  }

  /**
   * Patch all AWS SDK v2 clients and create traces when your application makes calls to AWS services.
   *
   * If you want to patch a specific client use {@link captureAWSClient} and if you are using AWS SDK v3 use {@link captureAWSv3Client} instead.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-awssdkclients.html
   *
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * const AWS = tracer.captureAWS(require('aws-sdk'));
   *
   * export const handler = async (_event: unknown, _context: unknown) => {
   *   ...
   * }
   * ```
   *
   * @deprecated Use {@link captureAWSv3Client} instead.
   * @param aws - AWS SDK v2 import
   */
  public captureAWS<T>(aws: T): T {
    if (!this.isTracingEnabled()) return aws;

    return this.provider.captureAWS(aws);
  }

  /**
   * Patch a specific AWS SDK v2 client and create traces when your application makes calls to that AWS service.
   *
   * If you want to patch all clients use {@link captureAWS} and if you are using AWS SDK v3 use {@link captureAWSv3Client} instead.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-awssdkclients.html
   *
   * @example
   * ```typescript
   * import { S3 } from 'aws-sdk';
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * const s3 = tracer.captureAWSClient(new S3({ apiVersion: '2006-03-01' }));
   *
   * export const handler = async (_event: unknown, _context: unknown) => {
   *   ...
   * }
   * ```
   * @deprecated Use {@link captureAWSv3Client} instead.
   * @param service - AWS SDK v2 client
   */
  /* v8 ignore start */ public captureAWSClient<T>(service: T): T {
    if (!this.isTracingEnabled()) return service;

    try {
      return this.provider.captureAWSClient(service);
    } catch (error) {
      try {
        // This is needed because some aws-sdk clients like AWS.DynamoDB.DocumentDB don't comply with the same
        // instrumentation contract like most base clients.
        // For detailed explanation see: https://github.com/aws-powertools/powertools-lambda-typescript/issues/524#issuecomment-1024493662
        this.provider.captureAWSClient((service as T & { service: T }).service);

        return service;
      } catch {
        throw error;
      }
    }
  } /* v8 ignore stop */

  /**
   * Patch an AWS SDK v3 client and create traces when your application makes calls to that AWS service.
   *
   * If you are using AWS SDK v2 use {@link captureAWSClient} instead.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-awssdkclients.html
   *
   * @example
   * ```typescript
   * import { S3Client } from '@aws-sdk/client-s3';
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * const client = new S3Client({});
   * tracer.captureAWSv3Client(client);
   *
   * export const handler = async (_event: unknown, _context: unknown) => {
   *   ...
   * }
   * ```
   *
   * @param service - AWS SDK v3 client
   */
  public captureAWSv3Client<T>(service: T): T {
    if (!this.isTracingEnabled()) return service;

    return this.provider.captureAWSv3Client(service);
  }

  /**
   * A decorator automating capture of metadata and annotations on segments or subsegments for a Lambda Handler.
   *
   * Using this decorator on your handler function will automatically:
   * * handle the subsegment lifecycle
   * * add the `ColdStart` annotation
   * * add the function response as metadata
   * * add the function error as metadata (if any)
   *
   * Note: Currently TypeScript only supports decorators on classes and methods. If you are using the
   * function syntax, you should use the middleware instead.
   *
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   *
   * class Lambda implements LambdaInterface {
   *   ⁣@tracer.captureLambdaHandler()
   *   public handler(_event: unknown, _context: unknown) {
   *     // ...
   *   }
   * }
   *
   * const handlerClass = new Lambda();
   * export const handler = handlerClass.handler.bind(handlerClass);
   * ```
   *
   * @param options - (_optional_) Options for the decorator
   */
  public captureLambdaHandler(
    options?: CaptureLambdaHandlerOptions
  ): HandlerMethodDecorator {
    return (_target, _propertyKey, descriptor) => {
      // biome-ignore lint/style/noNonNullAssertion: The descriptor.value is the method this decorator decorates, it cannot be undefined.
      const originalMethod = descriptor.value!;
      const tracerRef = this;
      // Use a function() {} instead of an () => {} arrow function so that we can
      // access `myClass` as `this` in a decorated `myClass.myMethod()`.
      descriptor.value = function (this: Handler, event, context, callback) {
        if (!tracerRef.isTracingEnabled()) {
          return originalMethod.apply(this, [event, context, callback]);
        }

        return tracerRef.provider.captureAsyncFunc(
          `## ${process.env._HANDLER}`,
          async (subsegment) => {
            tracerRef.annotateColdStart();
            tracerRef.addServiceNameAnnotation();
            let result: unknown;
            try {
              result = await originalMethod.apply(this, [
                event,
                context,
                callback,
              ]);
              if (options?.captureResponse ?? true) {
                tracerRef.addResponseAsMetadata(result, process.env._HANDLER);
              }
            } catch (error) {
              tracerRef.addErrorAsMetadata(error as Error);
              throw error;
            } finally {
              try {
                subsegment?.close();
              } catch (error) {
                console.warn(
                  'Failed to close or serialize segment %s. We are catching the error but data might be lost.',
                  subsegment?.name,
                  error
                );
              }
            }

            return result;
          }
        );
      } as SyncHandler<Handler> | AsyncHandler<Handler>;

      return descriptor;
    };
  }

  /**
   * A decorator automating capture of metadata and annotations on segments or subsegments for an arbitrary function.
   *
   * Using this decorator on your function will automatically:
   * * handle the subsegment lifecycle
   * * add the function response as metadata
   * * add the function error as metadata (if any)
   *
   * Note: Currently TypeScript only supports decorators on classes and methods. If you are using the
   * function syntax, you should use the middleware instead.
   *
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * import { LambdaInterface } from '@aws-lambda-powertools/commons';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   *
   * class Lambda implements LambdaInterface {
   *   ⁣@tracer.captureMethod()
   *   public myMethod(param: string) {
   *     // ...
   *   }
   *
   *   public handler(_event: unknown, _context: unknown) {
   *     this.myMethod('foo');
   *   }
   * }
   *
   * const handlerClass = new Lambda();
   * export const handler = handlerClass.handler.bind(handlerClass);;
   * ```
   *
   * @param options - (_optional_) Options for the decorator
   */
  public captureMethod<T extends AnyClass>(
    options?: CaptureMethodOptions
  ): MethodDecorator<T> {
    return (_target, propertyKey, descriptor) => {
      // biome-ignore lint/style/noNonNullAssertion: The descriptor.value is the method this decorator decorates, it cannot be undefined.
      const originalMethod = descriptor.value!;

      const tracerRef = this;
      // Use a function() {} instead of an () => {} arrow function so that we can
      // access `myClass` as `this` in a decorated `myClass.myMethod()`.
      descriptor.value = function (...args: unknown[]) {
        if (!tracerRef.isTracingEnabled()) {
          return originalMethod.apply(this, [...args]);
        }

        const methodName = String(propertyKey);
        const subsegmentName = options?.subSegmentName
          ? options.subSegmentName
          : `### ${methodName}`;

        return tracerRef.provider.captureAsyncFunc(
          subsegmentName,
          async (subsegment) => {
            // biome-ignore lint/suspicious/noExplicitAny: we don't know the type of the result because we're decorating arbitrary functions
            let result: any;
            try {
              result = await originalMethod.apply(this, [...args]);
              if (options?.captureResponse ?? true) {
                tracerRef.addResponseAsMetadata(result, methodName);
              }
            } catch (error) {
              tracerRef.addErrorAsMetadata(error as Error);

              throw error;
            } finally {
              try {
                subsegment?.close();
              } catch (error) {
                console.warn(
                  'Failed to close or serialize segment %s. We are catching the error but data might be lost.',
                  subsegment?.name,
                  error
                );
              }
            }

            return result;
          }
        );
      };

      return descriptor;
    };
  }

  /**
   * Get the current root AWS X-Ray trace id.
   *
   * Utility method that returns the current AWS X-Ray Root trace id. Useful as correlation id for downstream processes.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-traces
   *
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   *
   * export const handler = async () => {
   *   try {
   *     ...
   *   } catch (err) {
   *     const rootTraceId = tracer.getRootXrayTraceId();
   *
   *     // Example of returning an error response
   *     return {
   *       statusCode: 500,
   *       // Include the rootTraceId in the response so we can show a "contact support" button that
   *       // takes the customer to a customer service form with the trace as additional context.
   *       body: `Internal Error - Please contact support and quote the following id: ${rootTraceId}`,
   *       headers: { '_X_AMZN_TRACE_ID': rootTraceId },
   *     };
   *   }
   * }
   * ```
   */
  public getRootXrayTraceId(): string | undefined {
    return this.envVarsService.getXrayTraceId();
  }

  /**
   * Get the active segment or subsegment (if any) in the current scope.
   *
   * Usually you won't need to call this method unless you are creating custom subsegments or using manual mode.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-segments
   * @see https://docs.powertools.aws.dev/lambda/typescript/latest/core/tracer/#escape-hatch-mechanism
   *
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   *
   * export const handler = async (_event: unknown, _context: unknown) => {
   *   const currentSegment = tracer.getSegment();
   *   ... // Do something with segment
   * }
   * ```
   */
  public getSegment(): Segment | Subsegment | undefined {
    if (!this.isTracingEnabled()) {
      return new XraySubsegment('## Dummy segment');
    }
    const segment = this.provider.getSegment();
    if (segment === undefined) {
      console.warn(
        'Failed to get the current sub/segment from the context, this is likely because you are not using the Tracer in a Lambda function.'
      );
    }

    return segment;
  }

  /**
   * Get the current value of the AWS X-Ray Sampled flag.
   *
   * Utility method that returns the current AWS X-Ray Sampled flag.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-traces
   */
  public isTraceSampled(): boolean {
    if (!this.isTracingEnabled()) return false;

    return this.envVarsService.getXrayTraceSampled();
  }

  /**
   * Get the current value of the `tracingEnabled` property.
   *
   * You can use this method during manual instrumentation to determine
   * if tracer is currently enabled.
   */
  public isTracingEnabled(): boolean {
    return this.tracingEnabled;
  }

  /**
   * Add annotation to existing segment or subsegment.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-segment.html#xray-sdk-nodejs-segment-annotations
   *
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   *
   * export const handler = async (_event: unknown, _context: unknown) => {
   *   tracer.putAnnotation('successfulBooking', true);
   * }
   * ```
   *
   * @param key - Annotation key
   * @param value - Value for annotation
   */
  public putAnnotation(key: string, value: string | number | boolean): void {
    if (!this.isTracingEnabled()) return;

    this.provider.putAnnotation(key, value);
  }

  /**
   * Add metadata to existing segment or subsegment.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-segment.html#xray-sdk-nodejs-segment-metadata
   *
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   *
   * export const handler = async (_event: unknown, _context: unknown) => {
   *   const res = someLogic();
   *   tracer.putMetadata('paymentResponse', res);
   * }
   * ```
   *
   * @param key - Metadata key
   * @param value - Value for metadata
   * @param namespace - Namespace that metadata will lie under, if none is passed it will use the serviceName
   */
  public putMetadata(
    key: string,
    value: unknown,
    namespace?: string | undefined
  ): void {
    if (!this.isTracingEnabled()) return;

    this.provider.putMetadata(key, value, namespace || this.serviceName);
  }

  /**
   * Set the passed subsegment as the current active subsegment.
   *
   * If you are using a middleware or a decorator this is done automatically for you.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-subsegments.html
   *
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * import { Subsegment } from 'aws-xray-sdk-core';
   *
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   *
   * export const handler = async (_event: unknown, _context: unknown) => {
   *   const subsegment = new Subsegment('### foo.bar');
   *   tracer.setSegment(subsegment);
   * }
   * ```
   *
   * @param segment - Subsegment to set as the current segment
   */
  public setSegment(segment: Segment | Subsegment): void {
    if (!this.isTracingEnabled()) return;

    this.provider.setSegment(segment);
  }

  /**
   * Getter for `customConfigService`.
   * Used internally during initialization.
   */
  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  /**
   * Get for `envVarsService`.
   * Used internally during initialization.
   */
  private getEnvVarsService(): EnvironmentVariablesService {
    return this.envVarsService;
  }

  /**
   * Determine if we are running inside an Amplify CLI process.
   * Used internally during initialization.
   */
  private isAmplifyCli(): boolean {
    return (
      this.getEnvVarsService().getAwsExecutionEnv() ===
      'AWS_Lambda_amplify-mock'
    );
  }

  /**
   * Determine if we are running in a Lambda execution environment.
   * Used internally during initialization.
   */
  private isLambdaExecutionEnv(): boolean {
    return this.getEnvVarsService().getAwsExecutionEnv() !== '';
  }

  /**
   * Determine if we are running inside a SAM CLI process.
   * Used internally during initialization.
   */
  private isLambdaSamCli(): boolean {
    return this.getEnvVarsService().getSamLocal() !== '';
  }

  /**
   * Set `captureError` based on configuration passed and environment variables.
   * Used internally during initialization.
   */
  private setCaptureError(): void {
    const customConfigValue =
      this.getCustomConfigService()?.getTracingCaptureError();
    if (
      customConfigValue !== undefined &&
      customConfigValue.toLowerCase() === 'false'
    ) {
      this.captureError = false;

      return;
    }

    const envVarsValue = this.getEnvVarsService().getTracingCaptureError();
    if (envVarsValue.toLowerCase() === 'false') {
      this.captureError = false;

      return;
    }
  }

  /**
   * Patch all HTTP(s) clients and create traces when your application makes calls outgoing calls.
   *
   * Calls using third-party HTTP request libraries, such as Axios, are supported as long as they use the native http
   * module under the hood. Support for third-party HTTP request libraries is provided on a best effort basis.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-httpclients.html
   *
   * @param enabled - Whether or not to patch all HTTP clients
   */
  private setCaptureHTTPsRequests(enabled?: boolean): void {
    if (enabled !== undefined && !enabled) {
      this.captureHTTPsRequests = false;

      return;
    }

    const customConfigValue =
      this.getCustomConfigService()?.getCaptureHTTPsRequests();
    if (
      customConfigValue !== undefined &&
      customConfigValue.toLowerCase() === 'false'
    ) {
      this.captureHTTPsRequests = false;

      return;
    }

    const envVarsValue = this.getEnvVarsService().getCaptureHTTPsRequests();
    if (envVarsValue.toLowerCase() === 'false') {
      this.captureHTTPsRequests = false;

      return;
    }
  }

  /**
   * Set `captureResponse` based on configuration passed and environment variables.
   * Used internally during initialization.
   */
  private setCaptureResponse(): void {
    const customConfigValue =
      this.getCustomConfigService()?.getTracingCaptureResponse();
    if (
      customConfigValue !== undefined &&
      customConfigValue.toLowerCase() === 'false'
    ) {
      this.captureResponse = false;

      return;
    }

    const envVarsValue = this.getEnvVarsService().getTracingCaptureResponse();
    if (envVarsValue.toLowerCase() === 'false') {
      this.captureResponse = false;

      return;
    }
  }

  /**
   * Set `customConfigService` based on configuration passed.
   * Used internally during initialization.
   *
   * @param customConfigService - Custom configuration service to use
   */
  private setCustomConfigService(
    customConfigService?: ConfigServiceInterface
  ): void {
    this.customConfigService = customConfigService
      ? customConfigService
      : undefined;
  }

  /**
   * Method that reconciles the configuration passed with the environment variables.
   * Used internally during initialization.
   *
   * @param options - Configuration passed to the tracer
   */
  private setOptions(options: TracerOptions): Tracer {
    const { enabled, serviceName, captureHTTPsRequests, customConfigService } =
      options;

    this.envVarsService = environmentVariablesService;
    this.setCustomConfigService(customConfigService);
    this.setTracingEnabled(enabled);
    this.setCaptureResponse();
    this.setCaptureError();
    this.setServiceName(serviceName);
    this.setCaptureHTTPsRequests(captureHTTPsRequests);

    return this;
  }

  /**
   * Set `customConfigService` based on configurations passed and environment variables.
   * Used internally during initialization.
   *
   * @param serviceName - Name of the service to use
   */
  private setServiceName(serviceName?: string): void {
    if (serviceName !== undefined && this.isValidServiceName(serviceName)) {
      this.serviceName = serviceName;

      return;
    }

    const customConfigValue = this.getCustomConfigService()?.getServiceName();
    if (
      customConfigValue !== undefined &&
      this.isValidServiceName(customConfigValue)
    ) {
      this.serviceName = customConfigValue;

      return;
    }

    const envVarsValue = this.getEnvVarsService().getServiceName();
    if (envVarsValue !== undefined && this.isValidServiceName(envVarsValue)) {
      this.serviceName = envVarsValue;

      return;
    }
    this.serviceName = this.getDefaultServiceName();
  }

  /**
   * Set `tracingEnabled` based on configurations passed and environment variables.
   * Used internally during initialization.
   *
   * @param enabled - Whether or not tracing is enabled
   */
  private setTracingEnabled(enabled?: boolean): void {
    if (enabled !== undefined && !enabled) {
      this.tracingEnabled = enabled;

      return;
    }

    const customConfigValue =
      this.getCustomConfigService()?.getTracingEnabled();
    if (
      customConfigValue !== undefined &&
      customConfigValue.toLowerCase() === 'false'
    ) {
      this.tracingEnabled = false;

      return;
    }

    const envVarsValue = this.getEnvVarsService().getTracingEnabled();
    if (envVarsValue.toLowerCase() === 'false') {
      this.tracingEnabled = false;

      return;
    }

    if (
      this.isAmplifyCli() ||
      this.isLambdaSamCli() ||
      !this.isLambdaExecutionEnv()
    ) {
      this.tracingEnabled = false;
    }
  }
}

export { Tracer };
