import { Context } from 'aws-lambda';

/**
 * We need to define these types and interfaces here because we can't import them from @middy/core.
 * Importing them from @middy/core would introduce a dependency on @middy/core, which we don't want
 * because we want to keep it as an optional dependency. Those users who don't use the Powertools middleware
 * and use `tsc` to compile their code will get an error if we import from @middy/core, see #1068.
 * Given that we use a subset of the @middy/core types, we can define them here and avoid the dependency.
 */
type Request<TEvent = unknown, TResult = unknown, TErr = Error, TContext extends Context = Context> = {
  event: TEvent
  context: TContext
  response: TResult | null
  error: TErr | null
  internal: {
    [key: string]: unknown
  }
};

declare type MiddlewareFn<TEvent = unknown, TResult = unknown, TErr = Error, TContext extends Context = Context> = (request: Request<TEvent, TResult, TErr, TContext>) => unknown;

export type MiddlewareLikeObj<TEvent = unknown, TResult = unknown, TErr = Error, TContext extends Context = Context> = {
  before?: MiddlewareFn<TEvent, TResult, TErr, TContext>
  after?: MiddlewareFn<TEvent, TResult, TErr, TContext>
  onError?: MiddlewareFn<TEvent, TResult, TErr, TContext>
};

export type MiddyLikeRequest = {
  event: unknown
  context: Context
  response: unknown | null
  error: Error | null
};