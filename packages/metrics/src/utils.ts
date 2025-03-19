/**
 * Return the first non-empty string value that is defined.
 *
 * This is useful so that we can define the order of which variables to use
 * while also defining an order of fallbacks.
 *
 * @param values - The incoming strings to verify of they are defined.
 */
const getFirstDefinedValue = <T extends string | undefined | null>(
  ...values: Array<T>
): T | undefined => {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
};

export { getFirstDefinedValue };
