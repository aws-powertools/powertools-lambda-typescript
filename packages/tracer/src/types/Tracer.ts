import type { ConfigServiceInterface } from '../config';
import type { Handler } from 'aws-lambda';
import type {
  AsyncHandler,
  LambdaInterface,
  SyncHandler,
} from '@aws-lambda-powertools/commons/types';

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
  enabled?: boolean;
  serviceName?: string;
  captureHTTPsRequests?: boolean;
  customConfigService?: ConfigServiceInterface;
};

/**
 * Options for handler decorators and middleware.
 *
 * Options supported:
 * * `captureResponse` - (_optional_) - Disable response serialization as subsegment metadata
 *
 * Middleware usage:
 * @example
 * ```typescript
 * import middy from '@middy/core';
 *
 * const tracer = new Tracer();
 *
 * const lambdaHandler = async (_event: any, _context: any): Promise<void> => {};
 *
 * export const handler = middy(lambdaHandler)
 *  .use(captureLambdaHandler(tracer, { captureResponse: false }));
 * ```
 *
 * Decorator usage:
 * @example
 * ```typescript
 * const tracer = new Tracer();
 *
 * class Lambda implements LambdaInterface {
 *   @tracer.captureLambdaHandler({ captureResponse: false })
 *   public async handler(_event: any, _context: any): Promise<void> {}
 * }
 *
 * const handlerClass = new Lambda();
 * export const handler = handlerClass.handler.bind(handlerClass);
 * ```
 */
type CaptureLambdaHandlerOptions = {
  captureResponse?: boolean;
};

/**
 * Options for method decorators.
 *
 * Options supported:
 * * `subSegmentName` - (_optional_) - Set a custom name for the subsegment
 * * `captureResponse` - (_optional_) - Disable response serialization as subsegment metadata
 *
 * Usage:
 * @example
 * ```typescript
 * const tracer = new Tracer();
 *
 * class Lambda implements LambdaInterface {
 *   @tracer.captureMethod({ subSegmentName: 'gettingChargeId', captureResponse: false })
 *   private getChargeId(): string {
 *     return 'foo bar';
 *   }
 *
 *   @tracer.captureLambdaHandler({ captureResponse: false })
 *   public async handler(_event: any, _context: any): Promise<void> {
 *     this.getChargeId();
 *   }
 * }
 *
 * const handlerClass = new Lambda();
 * export const handler = handlerClass.handler.bind(handlerClass);
 * ```
 */
type CaptureMethodOptions = {
  subSegmentName?: string;
  captureResponse?: boolean;
};

type HandlerMethodDecorator = (
  target: LambdaInterface,
  propertyKey: string | symbol,
  descriptor:
    | TypedPropertyDescriptor<SyncHandler<Handler>>
    | TypedPropertyDescriptor<AsyncHandler<Handler>>
) => void;

// TODO: Revisit type below & make it more specific
type MethodDecorator = (
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  target: any,
  propertyKey: string | symbol,
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor: TypedPropertyDescriptor<any>
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
) => any;

export {
  TracerOptions,
  CaptureLambdaHandlerOptions,
  CaptureMethodOptions,
  HandlerMethodDecorator,
  MethodDecorator,
};
