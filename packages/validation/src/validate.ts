import { search } from '@aws-lambda-powertools/jmespath'; // Use default export
import Ajv, { type ValidateFunction } from 'ajv';
import { SchemaValidationError } from './errors';
import type { ValidateParams } from './types';

export function validate<T = unknown>(params: ValidateParams<T>): T {
  const { payload, schema, envelope, formats, externalRefs, ajv } = params;

  const ajvInstance = ajv || new Ajv({ allErrors: true });

  if (formats) {
    for (const key of Object.keys(formats)) {
      let formatDefinition = formats[key];
      if (
        typeof formatDefinition === 'object' &&
        formatDefinition !== null &&
        !(formatDefinition instanceof RegExp) &&
        !('async' in formatDefinition)
      ) {
        formatDefinition = { ...formatDefinition, async: false };
      }
      ajvInstance.addFormat(key, formatDefinition);
    }
  }

  if (externalRefs) {
    for (const refSchema of externalRefs) {
      ajvInstance.addSchema(refSchema);
    }
  }

  let validateFn: ValidateFunction;
  try {
    validateFn = ajvInstance.compile(schema);
  } catch (error) {
    throw new SchemaValidationError('Failed to compile schema', error);
  }

  const trimmedEnvelope = envelope?.trim();
  const dataToValidate = trimmedEnvelope
    ? search(trimmedEnvelope, payload as Record<string, unknown>)
    : payload;

  const valid = validateFn(dataToValidate);
  if (!valid) {
    throw new SchemaValidationError(
      'Schema validation failed',
      validateFn.errors
    );
  }

  return dataToValidate as T;
}
