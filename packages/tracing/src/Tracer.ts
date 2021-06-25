import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import { ProviderService, ProviderServiceInterface } from './provider';
import { Segment, Subsegment } from 'aws-xray-sdk-core'
import { ClassThatTraces, HandlerMethodDecorator, TracerOptions } from "../types"

class Tracer implements ClassThatTraces {
    public static coldStart: boolean = true;

    private tracingDisabled: boolean = false;

    private captureResponse: boolean = true;

    private captureError: boolean = true;

    private serviceName: string = 'serviceUndefined';

    private envVarsService?: EnvironmentVariablesService;

    private customConfigService?: ConfigServiceInterface;

    public provider: ProviderServiceInterface;

    public constructor(options: TracerOptions = {}) {
        this.setOptions(options);
        this.provider = new ProviderService();
    }

    public static isColdStart(): boolean {
        if (Tracer.coldStart === true) {
            Tracer.coldStart = false;

            return true;
        }

        return false;
    }

    public getSegment(): Segment | Subsegment | undefined {
        return this.provider.getSegment();
    }

    public setSegment(segment: Segment | Subsegment): void {
        return this.provider.setSegment(segment);
    }

    public putAnnotation(key: string, value: string | number | boolean): void {
        if (this.tracingDisabled) {
            console.debug("Tracing has been disabled, aborting putAnnotation")
            return;
        }

        console.debug(`Annotating on key ${key} with ${value}`);
        let document = this.getSegment();
        document?.addAnnotation(key, value);
    }

    public putMetadata(key: string, value: any, namespace?: string | undefined): void {
        if (this.tracingDisabled) {
            console.debug("Tracing has been disabled, aborting putMetadata")
            return;
        }

        namespace = namespace || this.serviceName;
        console.debug(`Adding metadata on key ${key} with ${value} at namespace ${namespace}`);
        let document = this.getSegment();
        document?.addMetadata(key, value, namespace);
    }

    public captureLambdaHanlder(): HandlerMethodDecorator {
        // TODO: check if this is needed here https://github.com/awslabs/aws-lambda-powertools-python/blob/87907c2d5578692829125ae2cd81b719af532c1f/aws_lambda_powertools/tracing/tracer.py#L288-L292
        return (target, propertyKey, descriptor) => {
            const originalMethod = descriptor.value;

            descriptor.value = (event, context, callback) => {
                let subsegment = new Subsegment(`## ${context.functionName}`);
                this.setSegment(subsegment);

                this.annotateColdStart();
                try {
                    console.debug('Calling lambda handler');
                    const result = originalMethod?.apply(this, [event, context, callback]);
                    console.debug('Successfully received lambda handler response');
                    this.addResponseAsMetadata(result, context.functionName);

                    return result
                } catch (error) {
                    console.error(`Exception received from ${context.functionName}`)
                    this.addFullErrorAsMetadata(error, context.functionName);
                    throw error;
                }
            };
        };
    }

    // TODO: check if the already imported AWS package can be passed as reference i.e. const AWS = require('aws-sdk') -> can we accept that AWS reference?
    // TODO: change return type to AWS in captureAWS() fn
    public captureAWS(): void {
        if (this.tracingDisabled) {
            console.debug("Tracing has been disabled, aborting patch")
            return;
        }

        // TODO: return captureAWS class
        // return AWSXRay.captureAWS(require('aws-sdk'));
    }

    // TODO: change return type to service class in captureAWSv3Client() fn
    // TODO: try to scope down service parameter type in captureAWSv3Client() fn
    public captureAWSv3Client(service: any): void {
        if (this.tracingDisabled) {
            console.debug("Tracing has been disabled, aborting patch")
            return;
        }

        // TODO: return instance of AWS service class
        // return AWSXRay.captureAWSv3Client(service);
    }

    // TODO: change return type to service class in captureAWSClient() fn
    // TODO: try to scope down service parameter type in captureAWSClient() fn
    public captureAWSClient(service: any): void {
        if (this.tracingDisabled) {
            console.debug("Tracing has been disabled, aborting patch")
            return;
        }

        // TODO: return instance of AWS service class
        // return AWSXRay.captureAWSClient(service);
    }

    private annotateColdStart(): void {
        if (Tracer.isColdStart()) {
            console.debug('Annotating cold start');
            this.putAnnotation('ColdStart', true);
        }
    }

    private addResponseAsMetadata(data?: any, methodName?: string): void {
        if (data === undefined || this.captureResponse === false) {
            return;
        }

        this.putMetadata(`${methodName} response`, data);
    }

    // TODO: fix type of error param of fn addFullErrorAsMetadata()
    private addFullErrorAsMetadata(error: Error, methodName?: string): void {
        let subsegment = this.getSegment();
        if (this.captureError === false) {
            return;
        }

        this.putMetadata(`${methodName} error`, error);
    }

    private getCustomConfigService(): ConfigServiceInterface | undefined {
        return this.customConfigService;
    }

    private getEnvVarsService(): EnvironmentVariablesService {
        return <EnvironmentVariablesService>this.envVarsService;
    }

    private isValidServiceName(serviceName?: string): boolean {
        return typeof serviceName === 'string' && serviceName.trim().length > 0;
    }

    private isLambdaSamCli(): boolean {
        return this.getEnvVarsService()?.getSamLocal() !== '';
    }

    private isChaliceCli(): boolean {
        return this.getEnvVarsService()?.getChaliceLocal() !== '';
    }

    private setTracingDisabled(disabled?: boolean): void {
        if (disabled !== undefined && disabled === true) {
            this.tracingDisabled = disabled;

            return;
        }

        const customConfigValue = this.getCustomConfigService()?.getTracingDisabled();
        if (customConfigValue !== undefined && customConfigValue === true) {
            this.tracingDisabled = customConfigValue;

            return;
        }

        const envVarsValue = this.getEnvVarsService()?.getTracingDisabled();
        if (envVarsValue === true) {
            this.tracingDisabled = envVarsValue;

            return;
        }

        if (this.isLambdaSamCli() || this.isChaliceCli()) {
            this.tracingDisabled = true;
        }
    }

    private setCaptureResponse(): void {
        const customConfigValue = this.getCustomConfigService()?.getTracingCaptureResponse();
        if (customConfigValue !== undefined && customConfigValue === true) {
            this.captureResponse = customConfigValue;

            return;
        }

        const envVarsValue = this.getEnvVarsService()?.getTracingCaptureResponse();
        if (envVarsValue === true) {
            this.captureResponse = envVarsValue;

            return;
        }
    }

    private setCaptureError(): void {
        const customConfigValue = this.getCustomConfigService()?.getTracingCaptureError();
        if (customConfigValue !== undefined && customConfigValue === true) {
            this.captureError = customConfigValue;

            return;
        }

        const envVarsValue = this.getEnvVarsService()?.getTracingCaptureError();
        if (envVarsValue === true) {
            this.captureError = envVarsValue;

            return;
        }
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
        this.setTracingDisabled(disabled);
        this.setCustomConfigService(customConfigService);
        this.setCaptureResponse();
        this.setCaptureError();
        this.setServiceName(serviceName);

        return this;
    }
}

export {
    Tracer
}