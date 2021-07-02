import { ContextMissingStrategy } from 'aws-xray-sdk-core/dist/lib/context_utils';
import { Namespace } from 'cls-hooked';
import { ProviderServiceInterface } from '.';
import { captureAWS, captureAWSClient, captureAWSv3Client, captureAsyncFunc, captureFunc, getNamespace, getSegment, setSegment, Segment, Subsegment, setContextMissingStrategy, setDaemonAddress, setLogger, Logger } from 'aws-xray-sdk-core';

class ProviderService implements ProviderServiceInterface {
  
  public captureAWS<T>(awssdk: T): T {
    return captureAWS(awssdk);
  }

  public captureAWSClient<T>(service: T): T {
    return captureAWSClient(service);
  }

  public captureAWSv3Client<T>(service: T): T {
    // Type must be aliased as any because of this https://github.com/aws/aws-xray-sdk-node/issues/439#issuecomment-859715660
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return captureAWSv3Client(service as any);
  }

  public captureAsyncFunc(name: string, fcn: (subsegment?: Subsegment) => unknown, _parent?: Segment | Subsegment): unknown {
    return captureAsyncFunc(name, fcn);
  }
  
  public captureFunc(name: string, fcn: (subsegment?: Subsegment) => unknown, _parent?: Segment | Subsegment): unknown {
    return captureFunc(name, fcn);
  }

  public getNamespace(): Namespace {
    return getNamespace();
  }

  public getSegment(): Segment | Subsegment | undefined {
    return getSegment();
  }

  public setContextMissingStrategy(strategy: unknown): void {
    setContextMissingStrategy(strategy as ContextMissingStrategy);
  }

  public setDaemonAddress(address: string): void {
    setDaemonAddress(address);
  }

  public setLogger(logObj: unknown): void {
    setLogger(logObj as Logger);
  }
  
  public setSegment(segment: Segment | Subsegment): void {
    setSegment(segment);
  }

}

export {
  ProviderService
};