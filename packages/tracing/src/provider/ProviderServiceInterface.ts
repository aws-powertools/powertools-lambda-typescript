import { Namespace } from 'cls-hooked';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

interface ProviderServiceInterface {
  getNamespace(): Namespace

  getSegment(): Segment | Subsegment | undefined

  setSegment(segment: Segment | Subsegment): void

  setLogger(logObj: unknown): void

  setDaemonAddress(address: string): void

  setContextMissingStrategy(strategy: unknown): void

  captureAWS<T>(awsservice: T): T

  captureAWSClient<T>(awsservice: T): T

  captureAWSv3Client<T>(awsservice: T): T

  captureFunc(name: string, fcn: (subsegment?: Subsegment) => unknown, parent?: Segment | Subsegment): unknown

  captureAsyncFunc(name: string, fcn: (subsegment?: Subsegment) => unknown, parent?: Segment | Subsegment): unknown
}

export {
  ProviderServiceInterface
};