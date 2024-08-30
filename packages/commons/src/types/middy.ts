import type { Context } from 'aws-lambda';

/**
 * This type represents the shape of a Middy.js request object.
 *
 * We need to define these types and interfaces here because we can't import them from Middy.js.
 *
 * Importing them from Middy.js would introduce a dependency on it, which we don't want
 * because we want to keep it as an optional dependency.
 *
 * Those users who don't use the Powertools for AWS Lambda (TypeScript) middleware
 * and use `tsc` to compile their code will get an error if we import them directly, see #1068.
 *
 * Given that we use a subset of Middy.js types, we can define them here and avoid the dependency.
 */
type Request<
  TEvent = unknown,
  TResult = unknown,
  TErr = Error,
  TContext extends Context = Context,
> = {
  event: TEvent;
  context: TContext;
  response: TResult | null;
  error: TErr | null;
  internal: {
    [key: string]: unknown;
  };
};

/**
 * This type represents the shape of a middleware function that makes up a middleware object.
 *
 * @see {@link MiddlewareLikeObj}
 */
type MiddlewareFn<
  TEvent = unknown,
  TResult = unknown,
  TErr = Error,
  TContext extends Context = Context,
> = (request: Request<TEvent, TResult, TErr, TContext>) => unknown;

/**
 * This type represents the shape of a middleware object that can be passed to the `use` method of a Middy-like middleware.
 */
type MiddlewareLikeObj<
  TEvent = unknown,
  TResult = unknown,
  TErr = Error,
  TContext extends Context = Context,
> = {
  before?: MiddlewareFn<TEvent, TResult, TErr, TContext>;
  after?: MiddlewareFn<TEvent, TResult, TErr, TContext>;
  onError?: MiddlewareFn<TEvent, TResult, TErr, TContext>;
};

/**
 * This type represents the `request` object that is passed to each middleware in the middleware chain.
 */
type MiddyLikeRequest = {
  event: unknown;
  context: Context;
  response: unknown | null;
  error: Error | null;
  internal: {
    [key: string]: unknown;
  };
};

/**
 * Cleanup function that is used to cleanup resources when a middleware returns early.
 * Each Powertools for AWS middleware that needs to perform cleanup operations will
 * store a cleanup function with this signature in the `request.internal` object.
 *
 * @see {@link middleware/cleanupMiddlewares.cleanupMiddlewares}
 *
 */
type CleanupFunction = (request: MiddyLikeRequest) => Promise<void>;

export type {
  Request,
  MiddlewareFn,
  MiddlewareLikeObj,
  MiddyLikeRequest,
  CleanupFunction,
};
