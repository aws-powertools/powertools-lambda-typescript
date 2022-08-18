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
 * Options for the captureMethod decorator to be used when decorating a method.
 *
 * Usage:
 * @example
 * ```typescript
 * const tracer = new Tracer();
 *
 * class MyThing {
 *   @tracer.captureMethod({ captureResponse: false, captureError: false })
 *   myMethod(): string {
 *     return 'foo bar';
 *   }
 * }
 * ```
 */
type TracerCaptureMethodOptions = {
  captureResponse?: boolean
  captureError?: boolean
};

/**
 * Options for the captureLambdaHandler decorator to be used when decorating a method.
 *
 * Usage:
 * @example
 * ```typescript
 * const tracer = new Tracer();
 *
 * class MyThing implements LambdaInterface {
 *   @tracer.captureLambdaHandler({ captureResponse: false, captureError: false })
 *   async handler(_event: any, _context: any): Promise<void> {}
 * }
 * ```
 */
type TracerCaptureLambdaHandlerOptions = {
  captureResponse?: boolean
  captureError?: boolean
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
  TracerCaptureLambdaHandlerOptions,
  TracerCaptureMethodOptions,
  HandlerMethodDecorator,
  MethodDecorator
};