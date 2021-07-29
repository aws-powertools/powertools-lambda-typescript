import { ConfigServiceInterface } from '../src/config';
import { Handler } from 'aws-lambda';
import { LambdaInterface } from '../examples/utils/lambda';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

type ClassThatTraces = {
  getSegment(): Segment | Subsegment | undefined
  setSegment(segment: Segment | Subsegment): void
  putAnnotation: (key: string, value: string | number | boolean) => void
  putMetadata: (key: string, value: unknown, namespace?: string | undefined) => void
  captureLambdaHanlder(): HandlerMethodDecorator
  captureAWS<T>(aws: T): void | T
  captureAWSv3Client<T>(service: T): void | T
  captureAWSClient<T>(service: T): void | T
    
};

type TracerOptions = {
  enabled?: boolean
  serviceName?: string
  customConfigService?: ConfigServiceInterface
};

type HandlerMethodDecorator = (target: LambdaInterface, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Handler>) => TypedPropertyDescriptor<Handler> | void;

// TODO: Revisit these types that don't work.
type MethodDecorator = <T>(target: LambdaInterface, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;

export {
  ClassThatTraces,
  TracerOptions,
  HandlerMethodDecorator,
  MethodDecorator
};