import { ConfigServiceInterface } from '../src/config';
import { Handler } from 'aws-lambda';
import { LambdaInterface } from '../examples/utils/lambda';

type TracerOptions = {
  enabled?: boolean
  serviceName?: string
  customConfigService?: ConfigServiceInterface
};

// TODO: Revisit type below, it doesn't allow to define async handlers.
type HandlerMethodDecorator = (target: LambdaInterface, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Handler>) => TypedPropertyDescriptor<Handler> | void;

type MethodDecorator = (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => any;

export {
  TracerOptions,
  HandlerMethodDecorator,
  MethodDecorator
};