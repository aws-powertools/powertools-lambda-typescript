import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type {
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
   * Registers an exception handler for a specific error class.
   *
   * If a handler for the given error class is already registered, it will be replaced and a warning will be logged.
   *
   * @param options - The options containing the error class and its associated handler.
   */
  public register(options: ExceptionHandlerOptions<Error>): void {
    const { error, handler } = options;
    const errorName = error.name;

    this.#logger.debug(`Adding exception handler for error class ${errorName}`);

    if (this.handlers.has(errorName)) {
      this.#logger.warn(
        `An exception handler for error class '${errorName}' is already registered. The previous handler will be replaced.`
      );
    }

    this.handlers.set(errorName, {
      error,
      handler: handler as ExceptionHandler,
    });
  }

  /**
   * Resolves and returns the appropriate exception handler for a given error instance.
   *
   * This method attempts to find a registered exception handler based on the error's constructor name.
   * If a matching handler is found, it is returned; otherwise, `undefined` is returned.
   *
   * @param error - The error instance for which to resolve an exception handler.
   */
  public resolve(error: Error): ExceptionHandler | undefined {
    const errorName = error.name;
    this.#logger.debug(`Looking for exception handler for error: ${errorName}`);

    const handlerOptions = this.handlers.get(errorName);
    if (handlerOptions) {
      this.#logger.debug(`Found exact match for error class: ${errorName}`);
      return handlerOptions.handler;
    }

    this.#logger.debug(`No exception handler found for error: ${errorName}`);
    return undefined;
  }

  /**
   * Checks if there are any registered exception handlers.
   */
  public hasHandlers(): boolean {
    return this.handlers.size > 0;
  }
}

export { ExceptionHandlerRegistry };
