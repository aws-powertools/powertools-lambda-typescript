import type { JSONValue } from '@aws-lambda-powertools/commons';
import { isString } from '@aws-lambda-powertools/commons';
import { fromBase64 } from '@aws-sdk/util-base64-node';
import { isUint8Array } from 'node:util/types';
import { TRANSFORM_METHOD_BINARY, TRANSFORM_METHOD_JSON } from '../constants';
import { TransformParameterError } from '../errors';
import type { TransformOptions } from '../types/BaseProvider';

/**
 * Utility function to transform a value.
 *
 * It supports JSON and binary transformations, as well as an 'auto' mode that will try to transform the value based on the key.
 *
 * @param {string | Uint8Array} value - Value to be transformed
 * @param {TransformOptions} transform - Transform to be applied, can be 'json', 'binary', or 'auto'
 * @param {boolean} throwOnTransformError - Whether to throw an error if the transformation fails, when transforming multiple values this can be set to false
 * @param {string} key - Key of the value to be transformed, used to determine the transformation method when using 'auto'
 */
const transformValue = (
  value: string | Uint8Array,
  transform: TransformOptions,
  throwOnTransformError: boolean,
  key: string
): string | JSONValue | Uint8Array | undefined => {
  try {
    const normalizedTransform = transform.toLowerCase();

    if (
      (normalizedTransform === TRANSFORM_METHOD_JSON ||
        (normalizedTransform === 'auto' &&
          key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_JSON}`))) &&
      (isString(value) || isUint8Array(value))
    ) {
      if (value instanceof Uint8Array) {
        value = new TextDecoder('utf-8').decode(value);
      }

      return JSON.parse(value) as JSONValue;
    } else if (
      (normalizedTransform === TRANSFORM_METHOD_BINARY ||
        (normalizedTransform === 'auto' &&
          key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_BINARY}`))) &&
      (isString(value) || isUint8Array(value))
    ) {
      if (value instanceof Uint8Array) {
        value = new TextDecoder('utf-8').decode(value);
      }

      return new TextDecoder('utf-8').decode(fromBase64(value));
    } else {
      return value;
    }
  } catch (error) {
    if (throwOnTransformError)
      throw new TransformParameterError(transform, (error as Error).message);

    return;
  }
};

export { transformValue };
