import { Segment, Subsegment } from 'aws-xray-sdk-core';

interface ProviderServiceInterface {
    getNamespace(): any;

    getSegment(): Segment | Subsegment | undefined;

    setSegment(segment: Segment | Subsegment): void;

    setLogger(logObj: any): void;

    setDaemonAddress(address: string): void;

    setContextMissingStrategy(strategy: any): void;

    captureAWS<T>(awsservice: T): T;

    captureAWSClient<T>(awsservice: T): T;

    captureAWSv3Client<T>(awsservice: T): T;

    captureFunc(name: string, fcn: (subsegment?: Subsegment) => any, parent?: Segment | Subsegment): any;

    captureAsyncFunc(name: string, fcn: (subsegment?: Subsegment) => any, parent?: Segment | Subsegment): any;
}

export {
    ProviderServiceInterface
};