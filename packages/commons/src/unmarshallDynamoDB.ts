import type { AttributeValue } from '@aws-sdk/client-dynamodb';

class UnmarshallDynamoDBAttributeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnmarshallDynamoDBAttributeError';
  }
}

// biome-ignore lint/suspicious/noExplicitAny: we need to use any here to support the different types of DynamoDB attributes
const typeHandlers: Record<string, (value: any) => unknown> = {
  NULL: () => null,
  S: (value) => value,
  B: (value) => value,
  BS: (value) => new Set(value),
  SS: (value) => new Set(value),
  BOOL: (value) => Boolean(value),
  N: (value) => convertNumber(value),
  NS: (value) => new Set((value as Array<string>).map(convertNumber)),
  L: (value) => (value as Array<AttributeValue>).map(convertAttributeValue),
  M: (value) =>
    Object.entries(value).reduce(
      (acc, [key, value]) => {
        acc[key] = convertAttributeValue(value as AttributeValue);
        return acc;
      },
      {} as Record<string, unknown>
    ),
};

const convertAttributeValue = (
  data: AttributeValue | Record<string, AttributeValue>
): unknown => {
  const [type, value] = Object.entries(data)[0];

  if (value !== undefined) {
    const handler = typeHandlers[type];
    if (!handler) {
      throw new UnmarshallDynamoDBAttributeError(
        `Unsupported type passed: ${type}`
      );
    }

    return handler(value);
  }

  throw new UnmarshallDynamoDBAttributeError(
    `Value is undefined for type: ${type}`
  );
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
