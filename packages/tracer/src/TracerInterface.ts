import { HandlerMethodDecorator, MethodDecorator } from './types';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

interface TracerInterface {
  addErrorAsMetadata(error: Error): void
  addResponseAsMetadata(data?: unknown, methodName?: string): void
  addServiceNameAnnotation(): void
  annotateColdStart(): void
  captureAWS<T>(aws: T): void | T
  captureAWSv3Client<T>(service: T): void | T
  captureAWSClient<T>(service: T): void | T
  captureLambdaHandler(): HandlerMethodDecorator
  captureMethod(): MethodDecorator
  getSegment(): Segment | Subsegment
  isTracingEnabled(): boolean
  putAnnotation: (key: string, value: string | number | boolean) => void
  putMetadata: (key: string, value: unknown, namespace?: string | undefined) => void
  setSegment(segment: Segment | Subsegment): void
}

export { 
  TracerInterface
};