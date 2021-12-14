import { Handler } from 'aws-lambda';
import { TracerInterface } from '.';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import { HandlerMethodDecorator, TracerOptions, MethodDecorator } from '../types';
import { ProviderService, ProviderServiceInterface } from './provider';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

class Tracer implements TracerInterface {
  public static coldStart: boolean = true;

  public provider: ProviderServiceInterface;
  
  private captureError: boolean = true;
  
  private captureResponse: boolean = true;

  private customConfigService?: ConfigServiceInterface;
  
  private envVarsService?: EnvironmentVariablesService;
  
  private serviceName: string = 'serviceUndefined';
  
  private tracingEnabled: boolean = true;

  public constructor(options: TracerOptions = {}) {
    this.setOptions(options);
    this.provider = new ProviderService();
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
   * const tracer = new Tracer({ serviceName: 'my-service' });
   * const AWS = tracer.captureAWS(require('aws-sdk'));
   * ```
   * 
   * @param aws - AWS SDK v2 import
   * @returns AWS - Instrumented AWS SDK
   */
  public captureAWS<T>(aws: T): T {
    if (this.tracingEnabled === false) return aws;

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
   * const tracer = new Tracer({ serviceName: 'my-service' });
   * tracer.captureAWS(require('aws-sdk'));
   * const s3 = tracer.captureAWSClient(new S3({ apiVersion: "2006-03-01" }));
   * ```
   * 
   * @param service - AWS SDK v2 client
   * @returns service - Instrumented AWS SDK v2 client
   */
  public captureAWSClient<T>(service: T): T {
    if (this.tracingEnabled === false) return service;

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
   * const tracer = new Tracer({ serviceName: 'my-service' });
   * const client = new S3Client({});
   * tracer.captureAWSv3Client(client);
   * ```
   * 
   * @param service - AWS SDK v3 client
   * @returns service - Instrumented AWS SDK v3 client
   */
  public captureAWSv3Client<T>(service: T): T {
    if (this.tracingEnabled === false) return service;

    return this.provider.captureAWSv3Client(service);
  }

  public captureLambdaHanlder(): HandlerMethodDecorator {
    return (target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = ((event, context, callback) => {
        if (this.tracingEnabled === false) {
          return originalMethod?.apply(target, [ event, context, callback ]);
        }

        return this.provider.captureAsyncFunc(`## ${context.functionName}`, async subsegment => {
          this.annotateColdStart();
          let result: unknown;
          try {
            result = await originalMethod?.apply(target, [ event, context, callback ]);
            this.addResponseAsMetadata(result, context.functionName);
          } catch (error) {
            this.addErrorAsMetadata(error as Error);
            // TODO: should this error be thrown?? If thrown we get a ERR_UNHANDLED_REJECTION. If not aren't we are basically catching a Customer error?
            // throw error;
          } finally {
            subsegment?.close();
          }
          
          return result;
        });
      }) as Handler;

      return descriptor;
    };
  }

  public captureMethod(): MethodDecorator {
    return (target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = (...args: unknown[]) => {
        if (this.tracingEnabled === false) {
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
   * Get the active segment or subsegment in the current scope.
   * 
   * Usually you won't need to call this method unless you are manipulating segments using the escape hatch pattern.
   *
   * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-segments
   * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer/#escape-hatch-mechanism
   * 
   * @example
   * ```typescript
   * import { Tracer } from '@aws-lambda-powertools/tracer';
   * 
   * const tracer = new Tracer({ serviceName: 'my-service' });
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
    const segment = this.provider.getSegment();
    if (segment === undefined) {
      throw new Error('Failed to get the current sub/segment from the context.');
    }

    return segment;
  }

  /**
   * Retrieve the current value of `ColdStart`.
   * 
   * If Tracer has been initialized outside of the Lambda handler then the same instance
   * of Tracer will be reused throghout the lifecycle of that same Lambda execution environment
   * and this method will return `false` after the first invocation.
   * 
   * @see https://docs.aws.amazon.com/lambda/latest/dg/runtimes-context.html
   * 
   * @returns boolean - true if is cold start otherwise false
   */
  public static isColdStart(): boolean {
    if (Tracer.coldStart === true) {
      Tracer.coldStart = false;

      return true;
    }

    return false;
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
   * const tracer = new Tracer({ serviceName: 'my-service' });
   * 
   * export const handler = async (_event: any, _context: any) => {
   *   tracer.putAnnotation('PaymentStatus', "SUCCESS");
   * }
   * ```
   * 
   * @param key - Annotation key
   * @param value - Value for annotation
   */
  public putAnnotation(key: string, value: string | number | boolean): void {
    if (this.tracingEnabled === false) return;

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
   * const tracer = new Tracer({ serviceName: 'my-service' });
   * 
   * export const handler = async (_event: any, _context: any) => {
   *   const res = someLogic()
   *  tracer.putAnnotation('PaymentResponse', res);
   * }
   * ```
   * 
   * @param key - Metadata key
   * @param value - Value for metadata
   * @param timestamp - Namespace that metadata will lie under, if none is passed it will use the serviceName
   */
  public putMetadata(key: string, value: unknown, namespace?: string | undefined): void {
    if (this.tracingEnabled === false) return;

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
   * const tracer = new Tracer({ serviceName: 'my-service' });
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
    return this.provider.setSegment(segment);
  }

  /**
    * Add an error to the current segment or subsegment as metadata.
    * Used internally by decoratorators and middlewares.
    *
    * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-errors
    *
    * @param error - Error to serialize as metadata
    */
  private addErrorAsMetadata(error: Error): void {
    const subsegment = this.getSegment();
    if (this.captureError === false) {
      subsegment.addErrorFlag();

      return;
    }

    subsegment.addError(error, false);
  }

  /**
    * Add an data to the current segment or subsegment as metadata.
    * Used internally by decoratorators and middlewares.
    *
    * @see https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-errors
    *
    * @param data - Data to serialize as metadata
    * @param methodName - Name of the method that is being traced
    */
  private addResponseAsMetadata(data?: unknown, methodName?: string): void {
    if (data === undefined || this.captureResponse === false || this.tracingEnabled === false) {
      return;
    }

    this.putMetadata(`${methodName} response`, data);
  }
  
  /**
   * Add ColdStart annotation to the current segment or subsegment.
   * Used internally by decoratorators and middlewares.
   */
  private annotateColdStart(): void {
    if (Tracer.isColdStart()) {
      this.putAnnotation('ColdStart', true);
    }
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
  private isValidServiceName(serviceName?: string): boolean {
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
    if (serviceName !== undefined && this.isValidServiceName(serviceName)) {
      this.serviceName = serviceName;

      return;
    }

    const customConfigValue = this.getCustomConfigService()?.getServiceName();
    if (customConfigValue !== undefined && this.isValidServiceName(customConfigValue)) {
      this.serviceName = customConfigValue;

      return;
    }

    const envVarsValue = this.getEnvVarsService()?.getServiceName();
    if (envVarsValue !== undefined && this.isValidServiceName(envVarsValue)) {
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
    if (enabled !== undefined && enabled === false) {
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

    if (this.isLambdaSamCli() || this.isLambdaExecutionEnv() === false) {
      this.tracingEnabled = false;
    }
  }

}

export {
  Tracer
};