import { CaptureLambdaHandlerOptions, CaptureMethodOptions, HandlerMethodDecorator, MethodDecorator } from './types';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

interface TracerInterface {
  addErrorAsMetadata(error: Error, remote?: boolean): void
  addResponseAsMetadata(data?: unknown, methodName?: string): void
  addServiceNameAnnotation(): void
  annotateColdStart(): void
  captureAWS<T>(aws: T): void | T
  captureAWSv3Client<T>(service: T): void | T
  captureAWSClient<T>(service: T): void | T
  captureLambdaHandler(options?: CaptureLambdaHandlerOptions): HandlerMethodDecorator
  captureMethod(options?: CaptureMethodOptions): MethodDecorator
  getSegment(): Segment | Subsegment | undefined
  getRootXrayTraceId(): string | undefined
  isTracingEnabled(): boolean
  putAnnotation: (key: string, value: string | number | boolean) => void
  putMetadata: (key: string, value: unknown, namespace?: string | undefined) => void
  setSegment(segment: Segment | Subsegment): void
}

export { 
  TracerInterface
};