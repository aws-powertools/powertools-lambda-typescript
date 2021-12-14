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

  public captureAWS<T>(aws: T): T {
    if (this.tracingEnabled === false) return aws;

    return this.provider.captureAWS(aws);
  }

  public captureAWSClient<T>(service: T): T {
    if (this.tracingEnabled === false) return service;

    return this.provider.captureAWSClient(service);
  }

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
  
  public getSegment(): Segment | Subsegment {
    const segment = this.provider.getSegment();
    if (segment === undefined) {
      throw new Error('Failed to get the current sub/segment from the context.');
    }

    return segment;
  }

  public static isColdStart(): boolean {
    if (Tracer.coldStart === true) {
      Tracer.coldStart = false;

      return true;
    }

    return false;
  }

  public putAnnotation(key: string, value: string | number | boolean): void {
    if (this.tracingEnabled === false) return;

    const document = this.getSegment();
    if (document instanceof Segment) {
      console.warn('You cannot annotate the main segment in a Lambda execution environment');
      
      return;
    }
    document?.addAnnotation(key, value);
  }
  
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
  
  public setSegment(segment: Segment | Subsegment): void {
    return this.provider.setSegment(segment);
  }

  private addErrorAsMetadata(error: Error): void {
    const subsegment = this.getSegment();
    if (this.captureError === false) {
      subsegment.addErrorFlag();

      return;
    }

    subsegment.addError(error, false);
  }

  private addResponseAsMetadata(data?: unknown, methodName?: string): void {
    if (data === undefined || this.captureResponse === false || this.tracingEnabled === false) {
      return;
    }

    this.putMetadata(`${methodName} response`, data);
  }
  
  private annotateColdStart(): void {
    if (Tracer.isColdStart()) {
      this.putAnnotation('ColdStart', true);
    }
  }

  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  private getEnvVarsService(): EnvironmentVariablesService {
    return <EnvironmentVariablesService> this.envVarsService;
  }
  
  private isLambdaExecutionEnv(): boolean {
    return this.getEnvVarsService()?.getAwsExecutionEnv() !== '';
  }
  
  private isLambdaSamCli(): boolean {
    return this.getEnvVarsService()?.getSamLocal() !== '';
  }

  private isValidServiceName(serviceName?: string): boolean {
    return typeof serviceName === 'string' && serviceName.trim().length > 0;
  }

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

  private setCustomConfigService(customConfigService?: ConfigServiceInterface): void {
    this.customConfigService = customConfigService ? customConfigService : undefined;
  }

  private setEnvVarsService(): void {
    this.envVarsService = new EnvironmentVariablesService();
  }

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