import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type {
  ErrorConstructor,
  ErrorHandler,
  ErrorHandlerRegistryOptions,
} from '../types/rest.js';

export class ErrorHandlerRegistry {
  readonly #handlers: Map<ErrorConstructor, ErrorHandler> = new Map();

  readonly #logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;

  public constructor(options: ErrorHandlerRegistryOptions) {
    this.#logger = options.logger;
  }

  /**
   * Registers an error handler for one or more error types.
   *
   * The handler will be called when an error of the specified type(s) is thrown.
   * If multiple error types are provided, the same handler will be registered
   * for all of them.
   *
   * @param errorType - The error constructor(s) to register the handler for
   * @param handler - The error handler function to call when the error occurs
   */
  public register<T extends Error>(
    errorType: ErrorConstructor<T> | ErrorConstructor<T>[],
    handler: ErrorHandler<T>
  ): void {
    const errorTypes = Array.isArray(errorType) ? errorType : [errorType];

    for (const type of errorTypes) {
      if (this.#handlers.has(type)) {
        this.#logger.warn(
          `Handler for ${type.name} already exists. The previous handler will be replaced.`
        );
      }
      this.#handlers.set(type, handler as ErrorHandler);
    }
  }

  /**
   * Resolves an error handler for the given error instance.
   *
   * The resolution process follows this order:
   * 1. Exact constructor match
   * 2. instanceof checks for inheritance
   * 3. Name-based matching (fallback for bundling issues)
   *
   * @param error - The error instance to find a handler for
   * @returns The error handler function or null if no match found
   */
  public resolve(error: Error): ErrorHandler | null {
    const exactHandler = this.#handlers.get(
      error.constructor as ErrorConstructor
    );
    if (exactHandler != null) return exactHandler;

    for (const [errorType, handler] of this.#handlers) {
      if (error instanceof errorType) {
        return handler;
      }
    }

    for (const [errorType, handler] of this.#handlers) {
      if (error.name === errorType.name) {
        return handler;
      }
    }

    return null;
  }
}
