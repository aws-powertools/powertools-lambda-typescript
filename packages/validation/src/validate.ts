import { search } from '@aws-lambda-powertools/jmespath';
import { Ajv, type ValidateFunction } from 'ajv';
import { SchemaCompilationError, SchemaValidationError } from './errors.js';
import type { ValidateParams } from './types.js';

/**
 *
 * @param params.payload - The payload to validate.
 * @param params.schema - The JSON schema to validate against.
 * @param params.envelope - Optional JMESPath expression to use as envelope for the payload.
 * @param params.formats - Optional formats for validation.
 * @param params.externalRefs - Optional external references for validation.
 * @param params.ajv - Optional Ajv instance to use for validation, if not provided a new instance will be created.
 */
const validate = <T = unknown>(params: ValidateParams): T => {
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
    throw new SchemaCompilationError('Failed to compile schema', {
      cause: error,
    });
  }

  const trimmedEnvelope = envelope?.trim();
  const dataToValidate = trimmedEnvelope
    ? search(trimmedEnvelope, payload as Record<string, unknown>)
    : payload;

  const valid = validateFn(dataToValidate);
  if (!valid) {
    throw new SchemaValidationError('Schema validation failed', {
      cause: validateFn.errors,
    });
  }

  return dataToValidate as T;
};

export { validate };
