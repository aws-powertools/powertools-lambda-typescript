import type { Context } from 'aws-lambda';
import type {
  AppSyncEventsPublishEvent,
  AppSyncEventsSubscribeEvent,
  OnPublishHandlerAggregateFn,
  OnPublishHandlerFn,
  OnSubscribeHandler,
} from '../types/appsync-events.js';
import { Router } from './Router.js';
import { UnauthorizedException } from './errors.js';
import { isAppSyncEventsEvent, isAppSyncEventsPublishEvent } from './utils.js';

/**
 * Resolver for AWS AppSync Events APIs.
 *
 * This resolver is designed to handle the `onPublish` and `onSubscribe` events
 * from AWS AppSync Events APIs. It allows you to register handlers for these events
 * and route them to the appropriate functions based on the event's path.
 *
 * @example
 * ```ts
 * import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
 *
 * const app = new AppSyncEventsResolver();
 *
 * app.onPublish('/foo', async (payload) => {
 *   // your business logic here
 *   return payload;
 * });
 *
 * export const handler = async (event, context) =>
 *   app.resolve(event, context);
 * ```
 */
class AppSyncEventsResolver extends Router {
  /**
   * Resolve the response based on the provided event and route handlers configured.
   *
   * @example
   * ```ts
   * import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
   *
   * const app = new AppSyncEventsResolver();
   *
   * app.onPublish('/foo', async (payload) => {
   *   // your business logic here
   *   return payload;
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * The method works also as class method decorator, so you can use it like this:
   *
   * @example
   * ```ts
   * import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
   *
   * const app = new AppSyncEventsResolver();
   *
   * class Lambda {
   *   ⁣@app.onPublish('/foo')
   *   async handleFoo(payload) {
   *     // your business logic here
   *     return payload;
   *   }
   *
   *   async handler(event, context) {
   *     return app.resolve(event, context);
   *   }
   * }
   *
   * const lambda = new Lambda();
   * export const handler = lambda.handler.bind(lambda);
   * ```
   *
   * @param event - The incoming event from AppSync Events
   * @param context - The context object provided by AWS Lambda
   */
  public async resolve(event: unknown, context: Context) {
    if (!isAppSyncEventsEvent(event)) {
      this.logger.warn(
        'Received an event that is not compatible with this resolver'
      );
      return;
    }

    if (isAppSyncEventsPublishEvent(event)) {
      return await this.handleOnPublish(event, context);
    }
    return await this.handleOnSubscribe(
      event as AppSyncEventsSubscribeEvent,
      context
    );
  }

  /**
   * Handle the `onPublish` event.
   *
   * @param event - The incoming event from AppSync Events
   * @param context - The context object provided by AWS Lambda
   */
  protected async handleOnPublish(
    event: AppSyncEventsPublishEvent,
    context: Context
  ) {
    const { path } = event.info.channel;
    const routeHandlerOptions = this.onPublishRegistry.resolve(path);
    if (!routeHandlerOptions) {
      return { events: event.events };
    }
    const { handler, aggregate } = routeHandlerOptions;
    if (aggregate) {
      try {
        return {
          events: await (handler as OnPublishHandlerAggregateFn).apply(this, [
            event.events,
            event,
            context,
          ]),
        };
      } catch (error) {
        this.logger.error(`An error occurred in handler ${path}`, error);
        if (error instanceof UnauthorizedException) throw error;
        return this.#formatErrorResponse(error);
      }
    }
    return {
      events: await Promise.all(
        event.events.map(async (message) => {
          const { id, payload } = message;
          try {
            const result = await (handler as OnPublishHandlerFn).apply(this, [
              payload,
              event,
              context,
            ]);
            return {
              id,
              payload: result,
            };
          } catch (error) {
            this.logger.error(`An error occurred in handler ${path}`, error);
            return {
              id,
              ...this.#formatErrorResponse(error),
            };
          }
        })
      ),
    };
  }

  /**
   * Handle the `onSubscribe` event.
   *
   * After resolving the correct handler, we call it with the event and context.
   * If the handler throws an error, we catch it and format the error response
   * for a friendly output to the client.
   *
   * @param event - The incoming event from AppSync Events
   * @param context - The context object provided by AWS Lambda
   */
  protected async handleOnSubscribe(
    event: AppSyncEventsSubscribeEvent,
    context: Context
  ) {
    const { path } = event.info.channel;
    const routeHandlerOptions = this.onSubscribeRegistry.resolve(path);
    if (!routeHandlerOptions) {
      return event.events;
    }
    const { handler } = routeHandlerOptions;
    try {
      return await (handler as OnSubscribeHandler).apply(this, [
        event,
        context,
      ]);
    } catch (error) {
      this.logger.error(`An error occurred in handler ${path}`, error);
      if (error instanceof UnauthorizedException) throw error;
      return this.#formatErrorResponse(error);
    }
  }

  /**
   * Format the error response to be returned to the client.
   *
   * @param error - The error object
   */
  #formatErrorResponse(error: unknown) {
    if (error instanceof Error) {
      return {
        error: `${error.name} - ${error.message}`,
      };
    }
    return {
      error: 'An unknown error occurred',
    };
  }
}

export { AppSyncEventsResolver };
