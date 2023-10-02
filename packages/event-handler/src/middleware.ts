import { Context } from 'aws-lambda';
import { ArgsDict, BaseProxyEvent, Response } from './types';
import { JSONData } from './types';

/** HTTP middleware function that wraps the route invocation in a AWS Lambda function */
type Middleware<T = JSONData | Response> = (
  event: BaseProxyEvent,
  context: Context,
  args: ArgsDict,
  next: () => Promise<T>
) => Promise<T>;

/** Model for an AWS Lambda HTTP handler function */
type Handler<T = JSONData | Response> = (
  event: BaseProxyEvent,
  context: Context,
  args?: ArgsDict
) => Promise<T>;

/** Wraps the AWS Lambda handler function with the provided middlewares.
 *
 * @remarks
 * The middewares are stacked in a classic onion-like pattern,
 *
 * @typeParam T - the response type of the handler function
 *
 * @param middlewares middlewares that must be wrapped around the handler
 * @param handler the handler function
 * @param args arguments for the handler function
 * @returns a handler function that is wrapped around the middlewares
 *
 * @internal
 */
const wrapWithMiddlewares =
  <T>(
    middlewares: Middleware<T>[],
    handler: Handler<T>,
    args: ArgsDict
  ): Handler<T> =>
  async (event: BaseProxyEvent, context: Context): Promise<T> => {
    const chain = middlewares.reduceRight(
      (next: () => Promise<T>, middleware: Middleware<T>) => () =>
        middleware(event, context, args, next),
      () => handler(event, context, args)
    );

    return await chain();
  };

export { Handler, Middleware, wrapWithMiddlewares };
