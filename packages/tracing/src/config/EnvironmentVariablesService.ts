import { ConfigService } from '.';

class EnvironmentVariablesService extends ConfigService {

    // Reserved environment variables
    private awsRegionVariable = 'AWS_REGION';
    private functionNameVariable = 'AWS_LAMBDA_FUNCTION_NAME';
    private functionVersionVariable = 'AWS_LAMBDA_FUNCTION_VERSION';
    private memoryLimitInMBVariable = 'AWS_LAMBDA_FUNCTION_MEMORY_SIZE';
    private xRayTraceIdVariable = '_X_AMZN_TRACE_ID';
    private samLocalVariable = 'AWS_SAM_LOCAL';
    private chaliceLocalVariable = 'AWS_CHALICE_CLI_MODE';

    public get(name: string): string {
        return process.env[name]?.trim() || '';
    }

    public getAwsRegion(): string {
        return this.get(this.awsRegionVariable);
    }

    public getFunctionMemory(): number {
        const value = this.get(this.memoryLimitInMBVariable);

        return Number(value);
    }

    public getFunctionName(): string {
        return this.get(this.functionNameVariable);
    }

    public getFunctionVersion(): string {
        return this.get(this.functionVersionVariable);
    }

    public getTracingDisabled(): boolean {
        const value = this.get(this.tracingDisabledVariable);

        return Boolean(value)
    }

    public getTracingCaptureResponse(): boolean {
        const value = this.get(this.tracerCaptureResponseVariable);

        return Boolean(value)
    }

    public getTracingCaptureError(): boolean {
        const value = this.get(this.tracerCaptureErrorVariable);

        return Boolean(value)
    }

    public getServiceName(): string {
        return this.get(this.serviceNameVariable);
    }

    public getXrayTraceId(): string {
        return this.get(this.xRayTraceIdVariable);
    }

    public getSamLocal(): string {
        return this.get(this.samLocalVariable);
    }

    public getChaliceLocal(): string {
        return this.get(this.chaliceLocalVariable);
    }
}

export {
    EnvironmentVariablesService,
};