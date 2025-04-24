/**
 * Error to be thrown to communicate the subscription is unauthorized.
 *
 * When this error is thrown, the client will receive a 40x error code
 * and the subscription will be closed.
 *
 * @example
 * ```ts
 * import {
 *   AppSyncEventsResolver,
 *   UnauthorizedException,
 * } from '@aws-lambda-powertools/event-handler/appsync-events';
 *
 * const app = new AppSyncEventsResolver();
 *
 * app.onPublish('/foo', async (payload) => {
 *   throw new UnauthorizedException('Unauthorized to publish to channel /foo');
 * });
 *
 * export const handler = async (event, context) =>
 *   app.resolve(event, context);
 * ```
 */
class UnauthorizedException extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UnauthorizedException';
  }
}

export { UnauthorizedException };
