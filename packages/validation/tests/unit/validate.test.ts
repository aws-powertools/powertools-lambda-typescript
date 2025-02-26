import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { SchemaValidationError } from '../../src/errors';
import type { ValidateParams } from '../../src/types';
import { validate } from '../../src/validate';

describe('validate function', () => {
  it('returns validated data when payload is valid', () => {
    // Prepare
    const payload = { name: 'John', age: 30 };
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
      additionalProperties: false,
    };

    const params: ValidateParams<typeof payload> = { payload, schema };

    // Act
    const result = validate<typeof payload>(params);

    // Assess
    expect(result).toEqual(payload);
  });

  it('throws SchemaValidationError when payload is invalid', () => {
    // Prepare
    const payload = { name: 'John', age: '30' };
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
      additionalProperties: false,
    };

    const params: ValidateParams = { payload, schema };

    // Act & Assess
    expect(() => validate(params)).toThrow(SchemaValidationError);
  });

  it('extracts data using envelope when provided', () => {
    // Prepare
    const payload = {
      data: {
        user: { name: 'Alice', age: 25 },
      },
    };
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
      additionalProperties: false,
    };

    const envelope = 'data.user';
    const params: ValidateParams = { payload, schema, envelope };

    // Act
    const result = validate(params);

    // Assess
    expect(result).toEqual({ name: 'Alice', age: 25 });
  });

  it('uses provided ajv instance and custom formats', () => {
    // Prepare
    const payload = { email: 'test@example.com' };
    const schema = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'custom-email' },
      },
      required: ['email'],
      additionalProperties: false,
    };

    const ajvInstance = new Ajv({ allErrors: true });
    const formats = {
      'custom-email': {
        type: 'string',
        validate: (email: string) => email.includes('@'),
      },
    };

    const params: ValidateParams = {
      payload,
      schema,
      ajv: ajvInstance,
      formats,
    };

    // Act
    const result = validate(params);

    // Assess
    expect(result).toEqual(payload);
  });

  it('adds external schemas to ajv instance when provided', () => {
    // Prepare
    const externalSchema = {
      $id: 'http://example.com/schemas/address.json',
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
      },
      required: ['street', 'city'],
      additionalProperties: false,
    };

    const schema = {
      type: 'object',
      properties: {
        address: { $ref: 'http://example.com/schemas/address.json' },
      },
      required: ['address'],
      additionalProperties: false,
    };

    const payload = {
      address: {
        street: '123 Main St',
        city: 'Metropolis',
      },
    };

    const params: ValidateParams = {
      payload,
      schema,
      externalRefs: [externalSchema],
    };

    // Act
    const result = validate(params);

    // Assess
    expect(result).toEqual(payload);
  });

  it('throws SchemaValidationError when schema compilation fails', () => {
    // Prepare
    // An invalid schema is provided to force ajvInstance.compile() to fail.
    const payload = { name: 'John' };
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'invalid-type' }, // invalid type to trigger failure
      },
    };

    const params: ValidateParams = { payload, schema };

    // Act & Assess
    expect(() => validate(params)).toThrow(SchemaValidationError);
  });
});
