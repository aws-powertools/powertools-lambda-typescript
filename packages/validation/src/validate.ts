import { search } from '@aws-lambda-powertools/jmespath';
import { Ajv, type ValidateFunction } from 'ajv';
import { SchemaCompilationError, SchemaValidationError } from './errors.js';
import type { ValidateParams } from './types.js';

/**
 * Validates a payload against a JSON schema using Ajv.
 *
 * @example
 * ```typescript
 * import { validate } from '@aws-lambda-powertools/validation';
 *
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number' },
 *   },
 *   required: ['name', 'age'],
 *   additionalProperties: false,
 * } as const;
 *
 * const payload = { name: 'John', age: 30 };
 *
 * const validatedData = validate({
 *   payload,
 *   schema,
 * });
 * ```
 *
 * When validating, you can also provide an optional JMESPath expression to extract a specific part of the payload
 * before validation using the `envelope` parameter. This is useful when the payload is nested or when you want to
 * validate only a specific part of it.
 *
 * ```typescript
 * import { validate } from '@aws-lambda-powertools/validation';
 *
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     user: { type: 'string' },
 *   },
 *   required: ['user'],
 *   additionalProperties: false,
 * } as const;
 *
 * const payload = {
 *   data: {
 *     user: 'Alice',
 *   },
 * };
 *
 * const validatedData = validate({
 *   payload,
 *   schema,
 *   envelope: 'data',
 * });
 * ```
 *
 * Since the Validation utility is built on top of Ajv, you can also provide custom formats and external references
 * to the validation process. This allows you to extend the validation capabilities of Ajv to suit your specific needs.
 *
 * @example
 * ```typescript
 * import { validate } from '@aws-lambda-powertools/validation';
 *
 * const formats = {
 *   ageRange: (value: number) => return value >= 0 && value <= 120,
 * };
 *
 * const definitionSchema = {
 *   $id: 'https://example.com/schemas/definitions.json',
 *   definitions: {
 *     user: {
 *       type: 'object',
 *       properties: {
 *         name: { type: 'string' },
 *         age: { type: 'number', format: 'ageRange' },
 *       },
 *       required: ['name', 'age'],
 *       additionalProperties: false,
 *     }
 *   }
 * } as const;
 *
 * const schema = {
 *   $id: 'https://example.com/schemas/user.json',
 *   type: 'object',
 *   properties: {
 *     user: { $ref: 'definitions.json#/definitions/user' },
 *   },
 *   required: ['user'],
 *   additionalProperties: false,
 * } as const;
 *
 * const payload = {
 *   user: {
 *     name: 'Alice',
 *     age: 25,
 *   },
 * };
 *
 * const validatedData = validate({
 *   payload,
 *   schema,
 *   externalRefs: [definitionSchema],
 *   formats,
 * });
 * ```
 *
 * Additionally, you can provide an existing Ajv instance to reuse the same instance across multiple validations. If
 * you don't provide an Ajv instance, a new one will be created for each validation.
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
    ajvInstance.addSchema(externalRefs);
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
