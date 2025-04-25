import { EnvironmentVariablesService } from '@aws-lambda-powertools/commons';
import { isRecord } from '@aws-lambda-powertools/commons/typeutils';
import type {
  GenericLogger,
  OnPublishHandler,
  OnSubscribeHandler,
  RouteOptions,
  RouterOptions,
} from '../types/appsync-events.js';
import { RouteHandlerRegistry } from './RouteHandlerRegistry.js';

/**
 * Class for registering routes for the `onPublish` and `onSubscribe` events in AWS AppSync Events APIs.
 */
class Router {
  /**
   * A map of registered routes for the `onPublish` event, keyed by their paths.
   */
  protected readonly onPublishRegistry: RouteHandlerRegistry;
  /**
   * A map of registered routes for the `onSubscribe` event, keyed by their paths.
   */
  protected readonly onSubscribeRegistry: RouteHandlerRegistry;
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  protected readonly logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
  /**
   * Whether the router is running in development mode.
   */
  protected readonly isDev: boolean = false;
  /**
   * The environment variables service instance.
   */
  protected readonly envService: EnvironmentVariablesService;

  public constructor(options?: RouterOptions) {
    this.envService = new EnvironmentVariablesService();
    const alcLogLevel = this.envService.get('AWS_LAMBDA_LOG_LEVEL');
    this.logger = options?.logger ?? {
      debug: alcLogLevel === 'DEBUG' ? console.debug : () => undefined,
      error: console.error,
      warn: console.warn,
    };
    this.onPublishRegistry = new RouteHandlerRegistry({
      logger: this.logger,
      eventType: 'onPublish',
    });
    this.onSubscribeRegistry = new RouteHandlerRegistry({
      logger: this.logger,
      eventType: 'onSubscribe',
    });
    this.isDev = this.envService.isDevMode();
  }

  /**
   * Register a handler function for the `onPublish` event.
   *
   * When setting a handler, the path must be a string with a namespace starting with `/`, for example `/default/*`.
   * A path can have multiple namespaces, all separated by `/`, for example `/default/foo/bar`.
   * Wildcards are allowed only at the end of the path, for example `/default/*` or `/default/foo/*`.
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
   * By default, the handler will be called for each event message received by the AWS Lambda function. For example, if
   * you receive 10 events, the handler will be called 10 times in parallel. When the handler is called, the first
   * parameter is the message `payload`, which is an object containing the message payload sent by the publisher, for
   * example:
   *
   * @example
   * ```json
   * {
   *   "foo": "bar",
   * }
   * ```
   *
   * If your function throws an error, we catch it and format the error response for a friendly output to the client corresponding to the
   * event that caused the error. In this case, that specific event will be dropped, but the other events will
   * still be processed.
   *
   * **Process all events at once**
   *
   * If you want to receive all the events at once, you can set the `aggregate` option to `true`. In this case, the
   * handler will be called only once with an array of events and you are responsible for handling the
   * events in your function and returning a list of events to be sent back to AWS AppSync.
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
   * }, {
   *   aggregate: true,
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * When the handler is called, the first parameter is an array of messages, which is an array of objects containing
   * the message payload sent by the publisher and their `id`, while the second and third parameters are optional and
   * are the original Lambda function event and context. Below is an example of the first parameter:
   *
   * @example
   * ```json
   * [
   *   {
   *     "id": "123456",
   *     "payload": {
   *       "foo": "bar",
   *     }
   *   },
   *   {
   *     "id": "654321",
   *     "payload": {
   *     }
   *   }
   * ]
   * ```
   *
   * When working with `aggregate` enabled, if your function throws an error, we catch it and format the error
   * response to be sent back to AppSync. This helps the client to understand what went wrong and handle the error accordingly.
   *
   * It's important to note that if your function throws an error, the entire batch of events will be dropped.
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
   * @param path - The path of the event to be registered, i.e. `/namespace/channel`
   * @param handler - The handler function to be called when the event is received
   * @param options - The options for the route handler
   * @param options.aggregate - Whether the resolver will send all the events to the resolver at once or one by one
   */
  public onPublish<T extends boolean = false>(
    path: string,
    handler: OnPublishHandler<T>,
    options?: RouteOptions<T>
  ): void;
  public onPublish<T extends boolean = false>(
    path: string,
    options?: RouteOptions<T>
  ): MethodDecorator;
  public onPublish<T extends boolean = false>(
    path: string,
    handler?: OnPublishHandler<T> | RouteOptions<T>,
    options?: RouteOptions<T>
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.onPublishRegistry.register({
        path,
        handler,
        aggregate: (options?.aggregate ?? false) as T,
      });
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      const routeOptions = isRecord(handler) ? handler : options;
      this.onPublishRegistry.register({
        path,
        handler: descriptor.value,
        aggregate: (routeOptions?.aggregate ?? false) as T,
      });
      return descriptor;
    };
  }

  /**
   * Register a handler function for the `onSubscribe` event.
   *
   * When setting a handler, the path must be a string with a namespace starting with `/`, for example `/default/*`.
   * A path can have multiple namespaces, all separated by `/`, for example `/default/foo/bar`.
   * Wildcards are allowed only at the end of the path, for example `/default/*` or `/default/foo/*`.
   *
   * @example
   * ```ts
   * import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
   *
   * const app = new AppSyncEventsResolver();
   *
   * app.onSubscribe('/foo', async (event) => {
   *   // your business logic here
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * The first parameter of the handler function is the original AWS AppSync event and the second parameter is the
   * AWS Lambda context.
   *
   * If your function throws an error, we catch it and format the error response to be sent back to AppSync. This
   * helps the client to understand what went wrong and handle the error accordingly, however it still prevents
   * the subscription from being established.
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
   *   ⁣@app.onSubscribe('/foo')
   *   async handleFoo(event) {
   *     // your business logic here
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
   * @param path - The path of the event to be registered, i.e. `/namespace/channel`
   * @param handler - The handler function to be called when the event is received
   */
  public onSubscribe(path: string, handler: OnSubscribeHandler): void;
  public onSubscribe(path: string): MethodDecorator;
  public onSubscribe(
    path: string,
    handler?: OnSubscribeHandler
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.onSubscribeRegistry.register({
        path,
        handler,
      });
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.onSubscribeRegistry.register({
        path,
        handler: descriptor.value,
      });
      return descriptor;
    };
  }
}

export { Router };
