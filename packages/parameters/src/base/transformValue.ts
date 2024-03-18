import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { isString } from '@aws-lambda-powertools/commons';
import { fromBase64 } from '@smithy/util-base64';
import {
  TRANSFORM_METHOD_BINARY,
  TRANSFORM_METHOD_JSON,
} from '../constants.js';
import { TransformParameterError } from '../errors.js';
import type { TransformOptions } from '../types/BaseProvider.js';

/**
 * Utility function to transform a value.
 *
 * It supports JSON and binary transformations, as well as an `auto` mode that will try to transform the value based on the key.
 *
 * The function supports both `string` and `Uint8Array` values as input. Other types will be returned as-is.
 *
 * If the value is a `Uint8Array`, it will be decoded to a string first. Then, when the transform is `json` or `auto` and the key ends with `.json`,
 * the value will be parsed as JSON using the `JSON.parse` function.
 *
 * When the transform is `binary` or `auto` and the key ends with `.binary`, the value will be decoded from base64 using the `fromBase64` function
 * from the `@smithy/util-base64` package.
 *
 * If the transformation fails, the function will return the value as-is unless `throwOnTransformError` is set to `true`.
 *
 * @note When using `auto` mode, the key must end with either `.json` or `.binary` to be transformed. Automatic transformation is supported only for
 * `getMultiple` calls.
 *
 * @param {string | Uint8Array} value - Value to be transformed
 * @param {TransformOptions} transform - Transform to be applied, can be `json`, `binary`, or `auto`
 * @param {boolean} throwOnTransformError - Whether to throw an error if the transformation fails, when transforming multiple values this can be set to false
 * @param {string} key - Key of the value to be transformed, used to determine the transformation method when using 'auto'
 */
const transformValue = (
  value: string | Uint8Array,
  transform: TransformOptions,
  throwOnTransformError: boolean,
  key: string
): string | JSONValue | Uint8Array | undefined => {
  const normalizedTransform = transform.toLowerCase();
  const isAutoTransform = normalizedTransform === 'auto';
  const isAutoJsonTransform =
    isAutoTransform && key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_JSON}`);
  const isAutoBinaryTransform =
    isAutoTransform &&
    key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_BINARY}`);
  const isJsonTransform = normalizedTransform === TRANSFORM_METHOD_JSON;
  const isBinaryTransform = normalizedTransform === TRANSFORM_METHOD_BINARY;

  // If the value is not a string or Uint8Array, or if the transform is `auto`
  // and the key does not end with `.json` or `.binary`, return the value as-is
  if (
    !(value instanceof Uint8Array || isString(value)) ||
    (isAutoTransform && !isAutoJsonTransform && !isAutoBinaryTransform)
  ) {
    return value;
  }

  try {
    // If the value is a Uint8Array, decode it to a string first
    if (value instanceof Uint8Array) {
      value = new TextDecoder('utf-8').decode(value);
    }

    // If the transform is `json` or `auto` and the key ends with `.json`, parse the value as JSON
    if (isJsonTransform || isAutoJsonTransform) {
      return JSON.parse(value) as JSONValue;
      // If the transform is `binary` or `auto` and the key ends with `.binary`, decode the value from base64
    } else if (isBinaryTransform || isAutoBinaryTransform) {
      return new TextDecoder('utf-8').decode(fromBase64(value));
    }
  } catch (error) {
    if (throwOnTransformError)
      throw new TransformParameterError(transform, (error as Error).message);

    return;
  }
};

export { transformValue };
