/**
 * Options to create an {@link InvocationScoped | `InvocationScoped`} value.
 *
 * Exactly one of the two shapes must be provided: `initial` for a value that
 * falls back to a shared default until an invocation sets its own, `fresh` for
 * a container that must be created anew for each invocation.
 *
 * @typeParam T - The type of the value being held
 *
 * @internal
 */
type InvocationScopedOptions<T> =
  | {
      /**
       * Value shared across invocations until one sets its own.
       */
      initial: T;
    }
  | {
      /**
       * Creates the value, called once per invocation on first access, and once
       * for the shared value.
       */
      fresh: () => T;
    };

export type { InvocationScopedOptions };
