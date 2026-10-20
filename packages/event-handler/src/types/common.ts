// biome-ignore lint/suspicious/noExplicitAny: We intentionally use `any` here to represent any type of data and keep the logger is as flexible as possible.
type Anything = any;

// #region resolve options

/**
 * Optional object to pass to the `AppSyncEventsResolver.resolve()` or `AppSyncGraphQLResolver.resolve()` methods.
 */
type ResolveOptions = {
  /**
   * Reference to `this` instance of the class that is calling the `resolve` method.
   *
   * This parameter should be used only when using `AppSyncEventsResolver.onPublish()`,
   * `AppSyncEventsResolver.onSubscribe()`, and `AppSyncGraphQLResolver.resolve()` as class method decorators, and
   * it's used to bind the decorated methods to your class instance.
   *
   * @example
   * ```ts
   * import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
   *
   * const app = new AppSyncEventsResolver();
   *
   * class Lambda {
   *   public scope = 'scoped';
   *
   *   ⁣@app.onPublish('/foo')
   *   public async handleFoo(payload: string) {
   *     return `${this.scope} ${payload}`;
   *   }
   *
   *   public async handler(event: unknown, context: Context) {
   *     return app.resolve(event, context, { scope: this });
   *   }
   * }
   * const lambda = new Lambda();
   * const handler = lambda.handler.bind(lambda);
   * ```
   */
  scope?: unknown;
};

export type { Anything, ResolveOptions };
