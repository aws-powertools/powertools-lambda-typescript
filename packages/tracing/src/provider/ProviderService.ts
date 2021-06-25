import { captureAWS, captureAWSClient, captureAWSv3Client, getNamespace, getSegment, setSegment, Segment, Subsegment, setContextMissingStrategy, setDaemonAddress, setLogger } from 'aws-xray-sdk-core';
import { ProviderServiceInterface } from '.';

class ProviderService implements ProviderServiceInterface {
    public getNamespace(): any {
        return getNamespace();
    }

    public getSegment(): Segment | Subsegment | undefined {
        return getSegment()
    }

    public setSegment(segment: Segment | Subsegment): void {
        setSegment(segment);
    }

    public setLogger(logObj: any): void {
        setLogger(logObj);
    }

    public setDaemonAddress(address: string): void {
        setDaemonAddress(address);
    }

    public setContextMissingStrategy(strategy: any): void {
        setContextMissingStrategy(strategy);
    }

    public captureAWS<T>(awssdk: T): T {
        return captureAWS(awssdk);
    }

    public captureAWSClient<T>(service: T): T {
        // Type must be aliased as any because of this https://github.com/aws/aws-xray-sdk-node/issues/439#issuecomment-859715660
        return captureAWSClient(service);
    }

    public captureAWSv3Client<T>(service: T): T {
        // Type must be aliased as any because of this https://github.com/aws/aws-xray-sdk-node/issues/439#issuecomment-859715660
        return captureAWSv3Client(service as any);
    }

}

export {
    ProviderService
};