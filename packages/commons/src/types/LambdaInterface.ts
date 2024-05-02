import type { Handler } from 'aws-lambda';

/**
 * A type that represents a synchronous Lambda handler.
 *
 * @deprecated Use {@link AsyncHandler} instead.
 */
type SyncHandler<T extends Handler> = (
  event: Parameters<T>[0],
  context: Parameters<T>[1],
  callback: Parameters<T>[2]
) => void;

/**
 * A type that represents an asynchronous Lambda handler.
 */
type AsyncHandler<T extends Handler> = (
  event: Parameters<T>[0],
  context: Parameters<T>[1]
) => Promise<NonNullable<Parameters<Parameters<T>[2]>[1]>>;

/**
 * An interface that represents an object-oriented Lambda handler.
 *
 * @example
 * ```typescript
 * import type { Context } from 'aws-lambda';
 * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
 *
 * class Lambda implements LambdaInterface {
 *   public handler = async (event: unknown, context: Context) => {
 *     // Your handler code here
 *   }
 * }
 *
 * const handlerClass = new Lambda();
 * export const handler = lambda.handler.bind(lambda);
 * ```
 */
interface LambdaInterface {
  handler: SyncHandler<Handler> | AsyncHandler<Handler>;
}

/**
 * A decorator function that can be used to decorate a method in a class that implements the `LambdaInterface`.
 */
type HandlerMethodDecorator = (
  target: LambdaInterface,
  propertyKey: string | symbol,
  descriptor:
    | TypedPropertyDescriptor<SyncHandler<Handler>>
    | TypedPropertyDescriptor<AsyncHandler<Handler>>
) => void;

export type {
  AsyncHandler,
  SyncHandler,
  LambdaInterface,
  HandlerMethodDecorator,
};
