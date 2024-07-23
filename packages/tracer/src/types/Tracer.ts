import type { HandlerMethodDecorator } from '@aws-lambda-powertools/commons/types';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';
import type { ConfigServiceInterface } from './ConfigServiceInterface.js';

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
  /**
   * Whether to trace outgoing HTTP requests made with the `http`, `https`, or `fetch` modules
   */
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

// biome-ignore lint/suspicious/noExplicitAny: this is a generic type that is intentionally open
type AnyClassMethod = (...args: any[]) => any;
// biome-ignore lint/suspicious/noExplicitAny: this is a generic type that is intentionally open
type AnyClass = new (...args: any[]) => any;

type MethodDecorator<T extends AnyClass> = (
  target: InstanceType<T>,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<AnyClassMethod>
) => void;

interface TracerInterface {
  addErrorAsMetadata(error: Error, remote?: boolean): void;
  addResponseAsMetadata(data?: unknown, methodName?: string): void;
  addServiceNameAnnotation(): void;
  annotateColdStart(): void;
  captureAWS<T>(aws: T): undefined | T;
  captureAWSv3Client<T>(service: T): undefined | T;
  captureAWSClient<T>(service: T): undefined | T;
  captureLambdaHandler(
    options?: CaptureLambdaHandlerOptions
  ): HandlerMethodDecorator;
  captureMethod<T extends AnyClass>(
    options?: CaptureMethodOptions
  ): MethodDecorator<T>;
  getSegment(): Segment | Subsegment | undefined;
  getRootXrayTraceId(): string | undefined;
  isTraceSampled(): boolean;
  isTracingEnabled(): boolean;
  putAnnotation: (key: string, value: string | number | boolean) => void;
  putMetadata: (
    key: string,
    value: unknown,
    namespace?: string | undefined
  ) => void;
  setSegment(segment: Segment | Subsegment): void;
}

export type {
  TracerOptions,
  CaptureLambdaHandlerOptions,
  CaptureMethodOptions,
  HandlerMethodDecorator,
  AnyClass,
  AnyClassMethod,
  MethodDecorator,
  TracerInterface,
};
