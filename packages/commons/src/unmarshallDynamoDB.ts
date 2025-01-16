import type { AttributeValue } from '@aws-sdk/client-dynamodb';

class UnmarshallDynamoDBAttributeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnmarshallDynamoDBAttributeError';
  }
}

const convertAttributeValue = (
  data: AttributeValue | Record<string, AttributeValue>
): unknown => {
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (key === 'NULL') {
        return null;
      }
      if (key === 'S' || key === 'B') {
        return value;
      }
      if (key === 'BS' || key === 'SS') {
        return new Set(value);
      }
      if (key === 'BOOL') {
        return Boolean(value);
      }
      if (key === 'N') {
        return convertNumber(value);
      }
      if (key === 'NS') {
        return new Set(
          (value as Array<string>).map((item) => convertNumber(item))
        );
      }
      if (key === 'L') {
        return (value as Array<AttributeValue>).map((item) =>
          convertAttributeValue(item)
        );
      }
      if (key === 'M') {
        return Object.entries(value).reduce(
          (acc, [key, value]) =>
            (
              // biome-ignore lint/suspicious/noAssignInExpressions: we are intentionally assigning the value to the accumulator
              // biome-ignore lint/style/noCommaOperator: required for the reduce function
              (acc[key] = convertAttributeValue(value as AttributeValue)), acc
            ),
          {} as Record<string, unknown>
        );
      }

      throw new UnmarshallDynamoDBAttributeError(
        `Unsupported type passed: ${key}`
      );
    }
    /* v8 ignore next */
  }
  /* v8 ignore next */
};

const convertNumber = (numString: string) => {
  const num = Number(numString);
  const infinityValues = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  const isLargeFiniteNumber =
    (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) &&
    !infinityValues.includes(num);
  if (isLargeFiniteNumber) {
    try {
      return BigInt(numString);
    } catch (error) {
      throw new UnmarshallDynamoDBAttributeError(
        `${numString} can't be converted to BigInt`
      );
    }
  }
  return num;
};

/**
 * Unmarshalls a DynamoDB AttributeValue to a JavaScript object.
 *
 * The implementation is loosely based on the official AWS SDK v3 unmarshall function but
 * without support the customization options and with assumed support for BigInt.
 *
 * @param data - The DynamoDB AttributeValue to unmarshall
 */
const unmarshallDynamoDB = (
  data: AttributeValue | Record<string, AttributeValue>
  // @ts-expect-error - We intentionally wrap the data into a Map to allow for nested structures
) => convertAttributeValue({ M: data });

export { unmarshallDynamoDB, UnmarshallDynamoDBAttributeError };
