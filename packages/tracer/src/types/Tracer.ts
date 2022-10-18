import { ConfigServiceInterface } from '../config';
import { Handler } from 'aws-lambda';
import { AsyncHandler, LambdaInterface, SyncHandler } from '@aws-lambda-powertools/commons';

/**
  * Options for the tracer class to be used during initialization.
  * 
  * Usage:
  * @example
  * ```typescript
  * const customConfigService: ConfigServiceInterface;
  * const tracerOptions: TracerOptions = {
  *   enabled?: true,
  *   serviceName?: 'serverlessAirline',
  *   captureHTTPsRequests?: true,
  *   customConfigService?: customConfigService, // Only needed for advanced uses
  * };
  * 
  * const tracer = new Tracer(tracerOptions);
  * ```
  */
type TracerOptions = {
  enabled?: boolean
  serviceName?: string
  captureHTTPsRequests?: boolean
  customConfigService?: ConfigServiceInterface
};

/**
 * Options for handler decorators and middleware.
 *
 * Usage:
 * @example
 * ```typescript
 * const tracer = new Tracer();
 *
 * class Lambda implements LambdaInterface {
 *   @tracer.captureLambdaHandler({ captureResponse: false })
 *   async handler(_event: any, _context: any): Promise<void> {}
 * }
 *
 * const handlerClass = new Lambda();
 * export const handler = handlerClass.handler.bind(handlerClass);
 * ```
 */
type HandlerOptions = {
  captureResponse?: boolean
};

type HandlerMethodDecorator = (
  target: LambdaInterface,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<SyncHandler<Handler>> | TypedPropertyDescriptor<AsyncHandler<Handler>>
) => void;

// TODO: Revisit type below & make it more specific
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
type MethodDecorator = (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => any;

export {
  TracerOptions,
  HandlerOptions,
  HandlerMethodDecorator,
  MethodDecorator
};