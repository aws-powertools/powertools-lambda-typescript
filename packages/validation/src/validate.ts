import { search } from '@aws-lambda-powertools/jmespath';
import { Ajv, type ValidateFunction } from 'ajv';
import { SchemaValidationError } from './errors.js';
import type { ValidateParams } from './types.js';

export function validate<T = unknown>(params: ValidateParams): T {
  const { payload, schema, envelope, formats, externalRefs, ajv } = params;
  const ajvInstance = ajv || new Ajv({ allErrors: true });

  if (formats) {
    for (const key of Object.keys(formats)) {
      ajvInstance.addFormat(key, formats[key]);
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
