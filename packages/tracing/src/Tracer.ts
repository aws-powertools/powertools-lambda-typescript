import { ClassThatTraces, HandlerMethodDecorator, TracerOptions } from "../types"

import { ConfigServiceInterface, EnvironmentVariablesService } from './config';

class Tracer implements ClassThatTraces {
    public static coldStart: boolean = true;

    private tracingDisabled: boolean = false;

    private captureResponse: boolean = true;

    private captureError: boolean = true;

    private serviceName: string = 'serviceUndefined';

    private envVarsService?: EnvironmentVariablesService;

    private customConfigService?: ConfigServiceInterface;

    public constructor(options: TracerOptions = {}) {
        this.setOptions(options);
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
            console.debug("Tracing has been disabled, aborting putAnnotation")
            return;
        }

        console.debug(`Annotating on key ${key} with ${value}`);
        // TODO: forward key, value to x-ray client
        // self.provider.put_annotation(key=key, value=value)
    }

    public putMetadata(key: string, value: any, namespace?: string | undefined): void {
        if (this.tracingDisabled) {
            console.debug("Tracing has been disabled, aborting putMetadata")
            return;
        }

        namespace = namespace || this.serviceName;
        console.debug(`Adding metadata on key ${key} with ${value} at namespace ${namespace}`);
        // TODO: forward key, value, namespace to x-ray client
        // self.provider.put_metadata(key=key, value=value, namespace=namespace)
    }

    public captureLambdaHanlder(): HandlerMethodDecorator {
        // TODO: check if this is needed here https://github.com/awslabs/aws-lambda-powertools-python/blob/87907c2d5578692829125ae2cd81b719af532c1f/aws_lambda_powertools/tracing/tracer.py#L288-L292
        return (target, propertyKey, descriptor) => {
            const originalMethod = descriptor.value;

            descriptor.value = (event, context, callback) => {
                // TODO: put/get (?) sub segment `## ${context.functionName}`
                // with self.provider.in_subsegment(name=f"## {lambda_handler_name}") as subsegment
                // TODO: fix subsegment var below
                let subsegment;
                this.annotateColdStart(subsegment);
                try {
                    console.debug('Calling lambda handler');
                    const result = originalMethod?.apply(this, [event, context, callback]);
                    console.debug('Successfully received lambda handler response');
                    this.addResponseAsMetadata(result, context.functionName, subsegment);

                    return result
                } catch (error) {
                    console.exception(`Exception received from ${context.functionName}`)
                    this.addFullErrorAsMetadata(error, context.functionName, subsegment);
                    throw error;
                }
            };
        };
    }

    // TODO: fix type of subsegment param of fn annotateColdStart()
    private annotateColdStart(subsegment: any): void {
        if (Tracer.isColdStart()) {
            // TODO: put annotation on subsegment for ColdStart
            // subsegment.put_annotation(key="ColdStart", value=True)
            // TODO: remove this console.log
            console.log('Annotating cold start');
        }
    }

    // TODO: fix type of subsegment param of fn addResponseAsMetadata()
    private addResponseAsMetadata(data?: any, methodName?: string, subsegment?: any): void {
        if (data === undefined || this.captureResponse === false || subsegment === undefined) {
            return;
        }

        // TODO: put metadata with response under subsegment
        // subsegment.put_metadata(key=f"{method_name} response", value=data, namespace=self._config["service"])
    }

    // TODO: fix type of subsegment param of fn addFullErrorAsMetadata()
    // TODO: fix type of error param of fn addFullErrorAsMetadata()
    private addFullErrorAsMetadata(error: Error, methodName?: string, subsegment?: any): void {
        if (this.captureError === false) {
            return;
        }

        // TODO: put metadata with error under subsegment
        // subsegment.put_metadata(key=f"{method_name} error", value=error, namespace=self._config["service"])
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
        return this.getEnvVarsService()?.getSamLocal() !== undefined;
    }

    private isChaliceCli(): boolean {
        return this.getEnvVarsService()?.getChaliceLocal() !== undefined;
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