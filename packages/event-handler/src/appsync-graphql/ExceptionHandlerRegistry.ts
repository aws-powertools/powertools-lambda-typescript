import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type {
  ErrorClass,
  ExceptionHandler,
  ExceptionHandlerOptions,
  ExceptionHandlerRegistryOptions,
} from '../types/appsync-graphql.js';

/**
 * Registry for storing exception handlers for GraphQL resolvers in AWS AppSync GraphQL API's.
 */
class ExceptionHandlerRegistry {
  /**
   * A map of registered exception handlers, keyed by their error class name.
   */
  protected readonly handlers: Map<string, ExceptionHandlerOptions> = new Map();
  /**
   * A logger instance to be used for logging debug and warning messages.
   */
  readonly #logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;

  public constructor(options: ExceptionHandlerRegistryOptions) {
    this.#logger = options.logger;
  }

  /**
   * Registers an exception handler for one or more error classes.
   *
   * If a handler for the given error class is already registered, it will be replaced and a warning will be logged.
   *
   * @param options - The options containing the error class(es) and their associated handler.
   * @param options.error - A single error class or an array of error classes to handle.
   * @param options.handler - The exception handler function that will be invoked when the error occurs.
   */
  public register(options: ExceptionHandlerOptions<Error>): void {
    const { error, handler } = options;
    const errors = Array.isArray(error) ? error : [error];

    for (const err of errors) {
      this.#registerErrorHandler(err, handler);
    }
  }

  /**
   * Resolves and returns the appropriate exception handler for a given error instance.
   *
   * This method attempts to find a registered exception handler based on the error class name.
   * If a matching handler is found, it is returned; otherwise, `null` is returned.
   *
   * @param error - The error instance for which to resolve an exception handler.
   */
  public resolve(error: Error): ExceptionHandler | null {
    const errorName = error.name;
    this.#logger.debug(`Looking for exception handler for error: ${errorName}`);

    const handlerOptions = this.handlers.get(errorName);
    if (handlerOptions) {
      this.#logger.debug(`Found exact match for error class: ${errorName}`);
      return handlerOptions.handler;
    }

    this.#logger.debug(`No exception handler found for error: ${errorName}`);
    return null;
  }

  /**
   * Merges handlers from another ExceptionHandlerRegistry into this registry.
   * Existing handlers for the same error class will be replaced and a warning will be logged.
   *
   * @param otherRegistry - The registry to merge handlers from.
   */
  public merge(otherRegistry: ExceptionHandlerRegistry): void {
    for (const [errorName, handlerOptions] of otherRegistry.handlers) {
      if (this.handlers.has(errorName)) {
        this.#warnHandlerOverriding(errorName);
      }
      this.handlers.set(errorName, handlerOptions);
    }
  }

  /**
   * Registers a error handler for a specific error class.
   *
   * @param errorClass - The error class to register the handler for.
   * @param handler - The exception handler function.
   */
  #registerErrorHandler(
    errorClass: ErrorClass<Error>,
    handler: ExceptionHandler
  ): void {
    const errorName = errorClass.name;

    this.#logger.debug(`Adding exception handler for error class ${errorName}`);

    if (this.handlers.has(errorName)) {
      this.#warnHandlerOverriding(errorName);
    }

    this.handlers.set(errorName, {
      error: errorClass,
      handler,
    });
  }

  /**
   * Logs a warning message when an exception handler is being overridden.
   *
   * This method is called internally when registering a new exception handler
   * for an error class that already has a handler registered. It warns the user
   * that the previous handler will be replaced with the new one.
   *
   * @param errorName - The name of the error class for which a handler is being overridden
   */
  #warnHandlerOverriding(errorName: string): void {
    this.#logger.warn(
      `An exception handler for error class '${errorName}' is already registered. The previous handler will be replaced.`
    );
  }
}

export { ExceptionHandlerRegistry };
