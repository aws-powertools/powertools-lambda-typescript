/**
 * Assert that the given value is an error.
 *
 * TypeScript treats errors as `unknown` when caught,
 * so we need to assert that the value is an error.
 *
 * We need this because in JavaScript, any value can be thrown
 * using the `throw` keyword i.e. `throw 1` is valid.
 *
 * @param error The value to assert is an error
 */
function assertIsError(error: unknown): asserts error is Error {
  if (!(error instanceof Error)) {
    throw error;
  }
}

/**
 * Fetch a string from an environment variable.
 *
 * Throws an error if the environment variable is not set.
 *
 * @param name The name of the environment variable
 */
const getStringFromEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }

  return value;
};

export { assertIsError, getStringFromEnv };
