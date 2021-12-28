import { HandlerMethodDecorator, MethodDecorator } from './types';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

interface TracerInterface {
  getSegment(): Segment | Subsegment | undefined
  setSegment(segment: Segment | Subsegment): void
  putAnnotation: (key: string, value: string | number | boolean) => void
  putMetadata: (key: string, value: unknown, namespace?: string | undefined) => void
  captureLambdaHandler(): HandlerMethodDecorator
  captureMethod(): MethodDecorator
  captureAWS<T>(aws: T): void | T
  captureAWSv3Client<T>(service: T): void | T
  captureAWSClient<T>(service: T): void | T
}

export { 
  TracerInterface
};