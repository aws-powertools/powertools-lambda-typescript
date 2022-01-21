import { Context } from 'aws-lambda';

interface MiddyLikeRequest<TEvent = unknown, TResult = unknown, TErr = Error, TContext extends Context = Context> {
  event: TEvent
  context: TContext
  response: TResult | null
  error: TErr | null
  internal: {
    [key: string]: unknown
  }
}

declare type MiddlewareFn<TEvent = unknown, TResult = unknown, TErr = Error, TContext extends Context = Context> = (request: MiddyLikeRequest<TEvent, TResult, TErr, TContext>) => unknown;

export interface MiddyLikeMiddlewareObj<TEvent = unknown, TResult = unknown, TErr = Error, TContext extends Context = Context> {
  before?: MiddlewareFn<TEvent, TResult, TErr, TContext>
  after?: MiddlewareFn<TEvent, TResult, TErr, TContext>
  onError?: MiddlewareFn<TEvent, TResult, TErr, TContext>
}