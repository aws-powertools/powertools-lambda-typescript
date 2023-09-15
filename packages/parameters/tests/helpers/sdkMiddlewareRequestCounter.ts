import type {
  InitializeHandler,
  HandlerExecutionContext,
  InitializeHandlerArguments,
  MiddlewareStack,
} from '@aws-sdk/types';

/**
 * Middleware to count the number of API calls made by the SDK.
 *
 * The AWS SDK for JavaScript v3 uses a middleware stack to manage the execution of
 * operations. Middleware can be added to the stack to perform custom tasks before
 * or after an operation is executed.
 *
 * This middleware is added to the stack to count the number of API calls (`ROUND_TRIP`) made by the SDK.
 * This allows us to verify that the SDK is making the expected number of API calls and thus test that
 * caching or forcing a retrieval are working as expected.
 *
 * @see {@link https://aws.amazon.com/blogs/developer/middleware-stack-modular-aws-sdk-js/|AWS Blog - Middleware Stack}
 */
export const middleware = {
  //
  counter: 0,
  applyToStack: <Input extends object, Output extends object>(
    stack: MiddlewareStack<Input, Output>
  ) => {
    // Middleware added to mark start and end of an complete API call.
    stack.add(
      <ServiceInputTypes extends object, ServiceOutputTypes extends object>(
        next: InitializeHandler<ServiceInputTypes, ServiceOutputTypes>,
        context: HandlerExecutionContext
      ) =>
        async (args: InitializeHandlerArguments<ServiceInputTypes>) => {
          // We only want to count API calls to retrieve data,
          // not the StartConfigurationSessionCommand
          if (
            context.clientName !== 'AppConfigDataClient' ||
            context.commandName !== 'StartConfigurationSessionCommand'
          ) {
            // Increment counter
            middleware.counter++;
          }

          // Call next middleware
          return await next(args);
        },
      { tags: ['ROUND_TRIP'] }
    );
  },
};
