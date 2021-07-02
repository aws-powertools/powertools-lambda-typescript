import { ClassThatTraces, HandlerMethodDecorator, TracerOptions } from '../types';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import { ProviderService, ProviderServiceInterface } from './provider';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

class Tracer implements ClassThatTraces {
  public static coldStart: boolean = true;

  public provider: ProviderServiceInterface;
  
  private captureError: boolean = true;
  
  private captureResponse: boolean = true;

  private customConfigService?: ConfigServiceInterface;
  
  private envVarsService?: EnvironmentVariablesService;
  
  private serviceName: string = 'serviceUndefined';
  
  private tracingDisabled: boolean = false;

  public constructor(options: TracerOptions = {}) {
    this.setOptions(options);
    this.provider = new ProviderService();
  }

  public captureAWS<T>(aws: T): void | T {
    if (this.tracingDisabled) {
      console.debug('Tracing has been disabled, aborting captureAWS');
      
      return;
    }

    console.warn('Not implemented');
    
    // TODO: return this.provider.captureAWS(aws);
    return aws;
  }

  public captureAWSClient<T>(service: T): void | T {
    if (this.tracingDisabled) {
      console.debug('Tracing has been disabled, aborting captureAWSClient');
      
      return;
    }

    console.warn('Not implemented');

    // TODO: return this.provider.captureAWSClient(service);
    return service;
  }

  public captureAWSv3Client<T>(service: T): void | T {
    if (this.tracingDisabled) {
      console.debug('Tracing has been disabled, aborting captureAWSv3Client');
      
      return;
    }

    console.warn('Not implemented');

    // TODO: return this.provider.captureAWSv3Client(service);
    return service;
  }

  public captureLambdaHanlder(): HandlerMethodDecorator {
    return (_target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = (event, context, callback) => {
        if (this.tracingDisabled) {
          console.debug('Tracing has been disabled, aborting captureLambdaHanlder');
          
          return originalMethod?.apply(this, [ event, context, callback ]);
        }

        this.provider.captureAsyncFunc(`## ${context.functionName}`, async subsegment => {
          this.annotateColdStart();
          let result;
          try {
            console.debug('Calling lambda handler');
            result = await originalMethod?.apply(this, [ event, context, callback ]);
            console.debug('Successfully received lambda handler response');
            this.addResponseAsMetadata(result, context.functionName);
          } catch (error) {
            console.error(`Exception received from ${context.functionName}`);
            this.addErrorAsMetadata(error);
            throw error;
          } finally {
            subsegment?.close();
          }
          
          return result;
        });
      };
    };
  }
  
  public getSegment(): Segment | Subsegment | undefined {
    return this.provider.getSegment();
  }

  public static isColdStart(): boolean {
    if (Tracer.coldStart === true) {
      Tracer.coldStart = false;

      return true;
    }

    return false;
  }

  public putAnnotation(key: string, value: string | number | boolean): void {
    if (this.tracingDisabled) {
      console.debug('Tracing has been disabled, aborting putAnnotation');
      
      return;
    }
    const document = this.getSegment();
    if (document instanceof Segment) {
      console.debug('You cannot annotate the main segment in a Lambda execution environment');
      
      return;
    }
    document?.addAnnotation(key, value);
  }
  
  public putMetadata(key: string, value: unknown, namespace?: string | undefined): void {
    if (this.tracingDisabled) {
      console.debug('Tracing has been disabled, aborting putMetadata');
      
      return;
    }
    const document = this.getSegment();
    if (document instanceof Segment) {
      console.debug('You cannot add metadata to the main segment in a Lambda execution environment');
      
      return;
    }
    
    namespace = namespace || this.serviceName;
    console.debug(`Adding metadata on key ${key} with ${value} at namespace ${namespace}`);
    document?.addMetadata(key, value, namespace);
  }
  
  public setSegment(segment: Segment | Subsegment): void {
    return this.provider.setSegment(segment);
  }

  private addErrorAsMetadata(error: Error): void {
    const subsegment = this.getSegment();
    if (this.captureError === false || subsegment === undefined || this.tracingDisabled) {
      return;
    }

    subsegment.addError(error, false);
  }

  private addResponseAsMetadata(data?: unknown, methodName?: string): void {
    if (data === undefined || this.captureResponse === false) {
      return;
    }

    this.putMetadata(`${methodName} response`, data);
  }
  
  private annotateColdStart(): void {
    if (Tracer.isColdStart()) {
      console.debug('Annotating cold start');
      this.putAnnotation('ColdStart', true);
    }
  }

  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  private getEnvVarsService(): EnvironmentVariablesService {
    return <EnvironmentVariablesService> this.envVarsService;
  }

  private isChaliceCli(): boolean {
    return this.getEnvVarsService()?.getChaliceLocal() !== '';
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
      disabled,
      serviceName,
      customConfigService
    } = options;

    this.setEnvVarsService();
    this.setCustomConfigService(customConfigService);
    this.setTracingDisabled(disabled);
    this.setCaptureResponse();
    this.setCaptureError();
    this.setServiceName(serviceName);

    return this;
  }

  private setServiceName(serviceName?: string): void {
    // TODO: check why TS doesn't like this serviceName !== undefined in the this.isValidServiceName fn  
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

  private setTracingDisabled(disabled?: boolean): void {
    if (disabled !== undefined && disabled === true) {
      this.tracingDisabled = disabled;

      return;
    }

    const customConfigValue = this.getCustomConfigService()?.getTracingDisabled();
    if (customConfigValue !== undefined && customConfigValue.toLowerCase() === 'true') {
      this.tracingDisabled = true;

      return;
    }

    const envVarsValue = this.getEnvVarsService()?.getTracingDisabled();
    if (envVarsValue.toLowerCase() === 'true') {
      this.tracingDisabled = true;

      return;
    }

    if (this.isLambdaSamCli() || this.isChaliceCli()) {
      this.tracingDisabled = true;
    }
  }

}

export {
  Tracer
};