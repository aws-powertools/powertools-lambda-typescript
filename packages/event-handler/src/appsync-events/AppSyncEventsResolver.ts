import type { Context } from 'aws-lambda';
import type {
  AppSyncEventsPublishEvent,
  AppSyncEventsSubscribeEvent,
  OnPublishHandlerAggregateFn,
  OnPublishHandlerFn,
  OnSubscribeHandler,
} from '../types/appsync-events.js';
import type { ResolveOptions } from '../types/common.js';
import { UnauthorizedException } from './errors.js';
import { Router } from './Router.js';
import { isAppSyncEventsEvent, isAppSyncEventsPublishEvent } from './utils.js';

/**
 * The maximum size in bytes of a single AWS AppSync Events event, including its `id`.
 *
 * Events larger than this limit are silently dropped by AppSync.
 *
 * @see {@link https://docs.aws.amazon.com/appsync/latest/eventapi/event-api-concepts.html}
 */
const MAX_EVENT_SIZE_IN_BYTES = 240 * 1024;

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
   *     return app.resolve(event, context, {
   *       scope: this, // bind decorated methods to the class instance
   *     });
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
  public async resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ) {
    if (!isAppSyncEventsEvent(event)) {
      this.logger.warn(
        'Received an event that is not compatible with this resolver'
      );
      return;
    }

    if (isAppSyncEventsPublishEvent(event)) {
      return await this.handleOnPublish(event, context, options);
    }
    return await this.handleOnSubscribe(
      event as AppSyncEventsSubscribeEvent,
      context,
      options
    );
  }

  /**
   * Handle the `onPublish` event.
   *
   * @param event - The incoming event from AppSync Events
   * @param context - The context object provided by AWS Lambda
   * @param options - Optional resolve options
   */
  protected async handleOnPublish(
    event: AppSyncEventsPublishEvent,
    context: Context,
    options?: ResolveOptions
  ) {
    const { path } = event.info.channel;
    const routeHandlerOptions = this.onPublishRegistry.resolve(path);
    if (!routeHandlerOptions) {
      return { events: event.events };
    }
    const { handler, aggregate } = routeHandlerOptions;
    if (aggregate) {
      try {
        const events = await (handler as OnPublishHandlerAggregateFn).apply(
          options?.scope ?? this,
          [event.events, event, context]
        );
        if (this.warnOnLargePayload && Array.isArray(events)) {
          for (const item of events) {
            this.#warnIfEventTooLarge(path, item);
          }
        }
        return { events };
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
            const result = await (handler as OnPublishHandlerFn).apply(
              options?.scope ?? this,
              [payload, event, context]
            );
            const response = {
              id,
              payload: result,
            };
            if (this.warnOnLargePayload) {
              this.#warnIfEventTooLarge(path, response);
            }
            return response;
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
   * @param options - Optional resolve options
   */
  protected async handleOnSubscribe(
    event: AppSyncEventsSubscribeEvent,
    context: Context,
    options?: ResolveOptions
  ) {
    const { path } = event.info.channel;
    const routeHandlerOptions = this.onSubscribeRegistry.resolve(path);
    if (!routeHandlerOptions) {
      return event.events;
    }
    const { handler } = routeHandlerOptions;
    try {
      await (handler as OnSubscribeHandler).apply(options?.scope ?? this, [
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
   * Emit a warning when a single event in the response exceeds the AWS AppSync
   * Events per-event size limit of 240 KB (including the event `id`).
   *
   * Events larger than this limit are silently dropped by AppSync, so this helps
   * surface oversized payloads before they are lost. To avoid log spam, the warning
   * is emitted at most once per channel path.
   *
   * The event is serialized with `JSON.stringify` to measure the size that AppSync
   * sees on the wire, which is why this check is opt-in via the `warnOnLargePayload`
   * option.
   *
   * @param path - The channel path the event was published to
   * @param event - The assembled response event to measure
   */
  #warnIfEventTooLarge(path: string, event: unknown) {
    if (this.largePayloadWarningSet.has(path)) return;
    const sizeInBytes = Buffer.byteLength(JSON.stringify(event ?? null));
    if (sizeInBytes <= MAX_EVENT_SIZE_IN_BYTES) return;
    this.largePayloadWarningSet.add(path);
    this.logger.warn(
      `One or more events published to channel '${path}' exceed the AWS AppSync Events per-event size limit of ${MAX_EVENT_SIZE_IN_BYTES} bytes (got ${sizeInBytes} bytes). Events larger than this limit are silently dropped by AppSync and will not be delivered to subscribers.`
    );
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
