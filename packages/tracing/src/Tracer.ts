import { Handler } from 'aws-lambda';
import { TracerInterface } from '.';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import { HandlerMethodDecorator, TracerOptions, MethodDecorator } from './types';
import { ProviderService, ProviderServiceInterface } from './provider';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

/**
 * ## Intro
 * Tracer is an opinionated thin wrapper for [AWS X-Ray SDK for Node.js](https://github.com/aws/aws-xray-sdk-node).
 * 
 * Tracing data can be visualized through AWS X-Ray Console.
 * 
 * ## Key features
 *   * Auto capture cold start as annotation, and responses or full exceptions as metadata
 *   * Auto-disable when not running in AWS Lambda environment
 *   * Support tracing functions via decorators, middleware, and manual instrumentation
 *   * Support tracing AWS SDK v2 and v3 via AWS X-Ray SDK for Node.js
 * 
 * ## Usage
 * 
 * For more usage examples, see [our documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer/).
 * 
 * ### Functions usage with middleware
 * 
 * If you use function-based Lambda handlers you can use the [captureLambdaHandler()](./_aws_lambda_powertools_tracer.Tracer.html) middy middleware to automatically:
 * * handle the subsegment lifecycle 
 * * add the `ServiceName` and `ColdStart` annotations
 * * add the function response as metadata
 * * add the function error as metadata (if any)
 * 
 * @example
 * ```typescript
 * import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';
 * import middy from '@middy/core';
 * 
 * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
 * 
 * export const handler = middy(async (_event: any, _context: any) => {
 *   ...
 * }).use(captureLambdaHandler(tracer));
 * ```
 * 
 * ### Object oriented usage with decorators
 * 
 * If instead you use TypeScript Classes to wrap your Lambda handler you can use the [@tracer.captureLambdaHandler()](./_aws_lambda_powertools_tracer.Tracer.html#captureLambdaHandler) decorator to automatically:
 * * handle the subsegment lifecycle 
 * * add the `ServiceName` and `ColdStart` annotations
 * * add the function response as metadata
 * * add the function error as metadata (if any)
 * 
 * @example
 * ```typescript
 * import { Tracer } from '@aws-lambda-powertools/tracer';
 * 
 * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
 * 
 * // FYI: Decorator might not render properly in VSCode mouse over due to https://github.com/microsoft/TypeScript/issues/39371 and might show as *@tracer* instead of `@tracer.captureLambdaHandler`
 * 
 * class Lambda {
 *   @tracer.captureLambdaHandler()
 *   public handler(event: any, context: any) {
 *     ...
 *   }
 * }
 * 
 * export const handlerClass = new Lambda();
 * export const handler = handlerClass.handler; 
 * ```
 * 
 * ### Functions usage with manual instrumentation
 * 
 * If you prefer to manually instrument your Lambda handler you can use the methods in the tracer class directly.
 *
 * @example
 * ```typescript
 * import { Tracer } from '@aws-lambda-powertools/tracer';
 * import { Segment } from 'aws-xray-sdk-core';
 * 
 * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
 * 
 * export const handler = async (_event: any, context: any) => {
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
 *       res = ...
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
class Tracer implements TracerInterface {
  
  public static coldStart: boolean = true;

  public provider: ProviderServiceInterface;
  
  private captureError: boolean = true;
  
  private captureResponse: boolean = true;

  private customConfigService?: ConfigServiceInterface;
  
  private envVarsService?: EnvironmentVariablesService;
  
  private serviceName?: string;
  
  private tracingEnabled: boolean = true;

  public constructor(options: TracerOptions = {}) {
    this.setOptions(options);
    this.provider = new ProviderService();
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
    */
  public addErrorAsMetadata(error: Error): void {
    if (!this.isTracingEnabled()) {
      return;
    }

    const subsegment = this.getSegment();
    if (!this.captureError) {
      subsegment.addErrorFlag();

      return;
    }

    subsegment.addError(error, false);
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
    if (data === undefined || !this.captureResponse || !this.isTracingEnabled()) {
      return;
    }

    this.putMetadata(`${methodName} response`, data);
  }

  /**
   * Add service name to the current segment or subsegment as annotation.
   * 
   */
  public addServiceNameAnnotation(): void {
    if (!this.isTracingEnabled() || this.serviceName === undefined) {
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
      this.putAnnotation('ColdStart', Tracer.coldStart);
    }
    if (Tracer.coldStart) {
      Tracer.coldStart = false;
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
   * export const handler = async (_event: any, _context: any) => {
   *   ...
   * }
   * ```
   * 
   * @param aws - AWS SDK v2 import
   * @returns AWS - Instrumented AWS SDK
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
   * import { S3 } from "aws-sdk";
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * 
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * const s3 = tracer.captureAWSClient(new S3({ apiVersion: "2006-03-01" }));
   * 
   * export const handler = async (_event: any, _context: any) => {
   *   ...
   * }
   * ```
   * 
   * @param service - AWS SDK v2 client
   * @returns service - Instrumented AWS SDK v2 client
   */
  public captureAWSClient<T>(service: T): T {
    if (!this.isTracingEnabled()) return service;

    return this.provider.captureAWSClient(service);
  }

  /**
   * Patch an AWS SDK v3 client and create traces when your application makes calls to that AWS service.
   * 
   * If you are using AWS SDK v2 use {@link captureAWSClient} instead.
   * 
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-awssdkclients.html
   * 
   * @example
   * ```typescript
   * import { S3Client } from "@aws-sdk/client-s3";
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * 
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * const client = new S3Client({});
   * tracer.captureAWSv3Client(client);
   * 
   * export const handler = async (_event: any, _context: any) => {
   *   ...
   * }
   * ```
   * 
   * @param service - AWS SDK v3 client
   * @returns service - Instrumented AWS SDK v3 client
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
   * 
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * 
   * class Lambda {
   *   @tracer.captureLambdaHandler()
   *   public handler(event: any, context: any) {
   *     ...
   *   }
   * }
   * 
   * export const handlerClass = new Lambda();
   * export const handler = handlerClass.handler; 
   * ```
   * 
   * @decorator Class
   */
  public captureLambdaHandler(): HandlerMethodDecorator {
    return (target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = ((event, context, callback) => {
        if (!this.isTracingEnabled()) {
          return originalMethod?.apply(target, [ event, context, callback ]);
        }

        return this.provider.captureAsyncFunc(`## ${process.env._HANDLER}`, async subsegment => {
          this.annotateColdStart();
          this.addServiceNameAnnotation();
          let result: unknown;
          try {
            result = await originalMethod?.apply(target, [ event, context, callback ]);
            this.addResponseAsMetadata(result, process.env._HANDLER);
          } catch (error) {
            this.addErrorAsMetadata(error as Error);
            throw error;
          } finally {
            subsegment?.close();
            subsegment?.flush();
          }
          
          return result;
        });
      }) as Handler;

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
   * 
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * 
   * class Lambda {
   *   @tracer.captureMethod()
   *   public myMethod(param: any) {
   *     ...
   *   }
   * 
   *   public handler(event: any, context: any) {
   *     ...
   *   }
   * }
   * 
   * export const handlerClass = new Lambda();
   * export const myMethod = handlerClass.myMethod; 
   * export const handler = handlerClass.handler; 
   * ```
   * 
   * @decorator Class
   */
  public captureMethod(): MethodDecorator {
    return (target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = (...args: unknown[]) => {
        if (!this.isTracingEnabled()) {
          return originalMethod?.apply(target, [...args]);
        }

        return this.provider.captureAsyncFunc(`### ${originalMethod.name}`, async subsegment => {
          let result;
          try {
            result = await originalMethod?.apply(this, [...args]);
            this.addResponseAsMetadata(result, originalMethod.name);
          } catch (error) {
            this.addErrorAsMetadata(error as Error);
            // TODO: should this error be thrown?? If thrown we get a ERR_UNHANDLED_REJECTION. If not aren't we are basically catching a Customer error?
            // throw error;
          } finally {
            subsegment?.close();
          }
          
          return result;
        });
      };

      return descriptor;
    };
  }

  /**
   * Retrieve the current value of `ColdStart`.
   * 
   * If Tracer has been initialized outside the Lambda handler then the same instance
   * of Tracer will be reused throughout the lifecycle of that same Lambda execution environment
   * and this method will return `false` after the first invocation.
   * 
   * @see https://docs.aws.amazon.com/lambda/latest/dg/runtimes-context.html
   * 
   * @returns boolean - `true` if is cold start, otherwise `false`
   */
  public static getColdStart(): boolean {
    if (Tracer.coldStart) {
      Tracer.coldStart = false;

      return true;
    }

    return false;
  }
  
  /**
   * Get the active segment or subsegment in the current scope.
   * 
   * Usually you won't need to call this method unless you are creating custom subsegments or using manual mode.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-segments
   * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer/#escape-hatch-mechanism
   * 
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * 
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * 
   * export const handler = async (_event: any, _context: any) => {
   *   const currentSegment = tracer.getSegment();
   *   ... // Do something with segment
   * }
   * ```
   * 
   * @returns segment - The active segment or subsegment in the current scope.
   */
  public getSegment(): Segment | Subsegment {
    if (!this.isTracingEnabled()) {
      return new Subsegment('## Dummy segment');
    }
    const segment = this.provider.getSegment();    
    if (segment === undefined) {
      throw new Error('Failed to get the current sub/segment from the context.');
    }
 
    return segment;
  }

  /**
   * Get the current value of the `tracingEnabled` property.
   * 
   * You can use this method during manual instrumentation to determine
   * if tracer is currently enabled.
   * 
   * @returns tracingEnabled - `true` if tracing is enabled, `false` otherwise. 
   */
  public isTracingEnabled(): boolean {
    return this.tracingEnabled;
  }

  /**
   * Adds annotation to existing segment or subsegment.
   * 
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-segment.html#xray-sdk-nodejs-segment-annotations
   * 
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * 
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * 
   * export const handler = async (_event: any, _context: any) => {
   *   tracer.putAnnotation('successfulBooking', true);
   * }
   * ```
   * 
   * @param key - Annotation key
   * @param value - Value for annotation
   */
  public putAnnotation(key: string, value: string | number | boolean): void {
    if (!this.isTracingEnabled()) return;

    const document = this.getSegment();
    if (document instanceof Segment) {
      console.warn('You cannot annotate the main segment in a Lambda execution environment');
      
      return;
    }
    document?.addAnnotation(key, value);
  }
  
  /**
   * Adds metadata to existing segment or subsegment.
   * 
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-segment.html#xray-sdk-nodejs-segment-metadata
   * 
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * 
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * 
   * export const handler = async (_event: any, _context: any) => {
   *   const res = someLogic();
   *   tracer.putMetadata('paymentResponse', res);
   * }
   * ```
   * 
   * @param key - Metadata key
   * @param value - Value for metadata
   * @param namespace - Namespace that metadata will lie under, if none is passed it will use the serviceName
   */
  public putMetadata(key: string, value: unknown, namespace?: string | undefined): void {
    if (!this.isTracingEnabled()) return;

    const document = this.getSegment();
    if (document instanceof Segment) {
      console.warn('You cannot add metadata to the main segment in a Lambda execution environment');
      
      return;
    }
    
    namespace = namespace || this.serviceName;
    document?.addMetadata(key, value, namespace);
  }
  
  /**
   * Sets the passed subsegment as the current active subsegment.
   * 
   * If you are using a middleware or a decorator this is done automatically for you.
   * 
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-subsegments.html
   * 
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * import { Segment } from 'aws-xray-sdk-core';
   * 
   * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
   * 
   * export const handler = async (_event: any, _context: any) => {
   *   const subsegment = new Subsegment('### foo.bar');
   *   tracer.setSegment(subsegment);
   * }
   * ```
   * 
   * @param segment - Subsegment to set as the current segment
   */
  public setSegment(segment: Segment | Subsegment): void {
    if (!this.isTracingEnabled()) return;
    
    return this.provider.setSegment(segment);
  }

  /**
   * Getter for `customConfigService`.
   * Used internally during initialization.
   */
  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  /**
   * Getter for `envVarsService`.
   * Used internally during initialization.
   */
  private getEnvVarsService(): EnvironmentVariablesService {
    return <EnvironmentVariablesService> this.envVarsService;
  }
  
  /**
   * Determine if we are running in a Lambda execution environment.
   * Used internally during initialization.
   */
  private isLambdaExecutionEnv(): boolean {
    return this.getEnvVarsService()?.getAwsExecutionEnv() !== '';
  }
  
  /**
   * Determine if we are running inside a SAM CLI process.
   * Used internally during initialization.
   */
  private isLambdaSamCli(): boolean {
    return this.getEnvVarsService()?.getSamLocal() !== '';
  }

  /**
   * Validate that the service name provided is valid.
   * Used internally during initialization.
   * 
   * @param serviceName - Service name to validate
   */
  private static isValidServiceName(serviceName?: string): boolean {
    return typeof serviceName === 'string' && serviceName.trim().length > 0;
  }

  /**
   * Setter for `captureError` based on configuration passed and environment variables.
   * Used internally during initialization.
   */
  private setCaptureError(): void {
    const customConfigValue = this.getCustomConfigService()?.getTracingCaptureError();
    if (customConfigValue !== undefined && customConfigValue.toLowerCase() === 'false') {
      this.captureError = false;

      return;
    }

    const envVarsValue = this.getEnvVarsService()?.getTracingCaptureError();
    if (envVarsValue.toLowerCase() === 'false') {
      this.captureError = false;

      return;
    }
  }

  /**
   * Setter for `captureResponse` based on configuration passed and environment variables.
   * Used internally during initialization.
   */
  private setCaptureResponse(): void {
    const customConfigValue = this.getCustomConfigService()?.getTracingCaptureResponse();
    if (customConfigValue !== undefined && customConfigValue.toLowerCase() === 'false') {
      this.captureResponse = false;

      return;
    }

    const envVarsValue = this.getEnvVarsService()?.getTracingCaptureResponse();
    if (envVarsValue.toLowerCase() === 'false') {
      this.captureResponse = false;

      return;
    }
  }

  /**
   * Setter for `customConfigService` based on configuration passed.
   * Used internally during initialization.
   * 
   * @param customConfigService - Custom configuration service to use
   */
  private setCustomConfigService(customConfigService?: ConfigServiceInterface): void {
    this.customConfigService = customConfigService ? customConfigService : undefined;
  }

  /**
   * Setter and initializer for `envVarsService`.
   * Used internally during initialization.
   */
  private setEnvVarsService(): void {
    this.envVarsService = new EnvironmentVariablesService();
  }

  /**
   * Method that reconciles the configuration passed with the environment variables.
   * Used internally during initialization.
   * 
   * @param options - Configuration passed to the tracer
   */
  private setOptions(options: TracerOptions): Tracer {
    const {
      enabled,
      serviceName,
      customConfigService
    } = options;

    this.setEnvVarsService();
    this.setCustomConfigService(customConfigService);
    this.setTracingEnabled(enabled);
    this.setCaptureResponse();
    this.setCaptureError();
    this.setServiceName(serviceName);

    return this;
  }

  /**
   * Setter for `customConfigService` based on configurations passed and environment variables.
   * Used internally during initialization.
   * 
   * @param serviceName - Name of the service to use
   */
  private setServiceName(serviceName?: string): void {
    if (serviceName !== undefined && Tracer.isValidServiceName(serviceName)) {
      this.serviceName = serviceName;

      return;
    }

    const customConfigValue = this.getCustomConfigService()?.getServiceName();
    if (customConfigValue !== undefined && Tracer.isValidServiceName(customConfigValue)) {
      this.serviceName = customConfigValue;

      return;
    }

    const envVarsValue = this.getEnvVarsService()?.getServiceName();
    if (envVarsValue !== undefined && Tracer.isValidServiceName(envVarsValue)) {
      this.serviceName = envVarsValue;

      return;
    }
  }

  /**
   * Setter for `tracingEnabled` based on configurations passed and environment variables.
   * Used internally during initialization.
   * 
   * @param enabled - Whether or not tracing is enabled
   */
  private setTracingEnabled(enabled?: boolean): void {
    if (enabled !== undefined && !enabled) {
      this.tracingEnabled = enabled;
      
      return;
    }

    const customConfigValue = this.getCustomConfigService()?.getTracingEnabled();
    if (customConfigValue !== undefined && customConfigValue.toLowerCase() === 'false') {
      this.tracingEnabled = false;
      
      return;
    }

    const envVarsValue = this.getEnvVarsService()?.getTracingEnabled();
    if (envVarsValue.toLowerCase() === 'false') {
      this.tracingEnabled = false;
      
      return;
    }

    if (this.isLambdaSamCli() || !this.isLambdaExecutionEnv()) {
      this.tracingEnabled = false;
    }
  }

}

export {
  Tracer
};