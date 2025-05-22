import type {
  JSONPrimitive,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';

export function isPrimitive(value: JSONValue): value is JSONPrimitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}
