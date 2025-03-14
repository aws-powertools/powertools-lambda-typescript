import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { SchemaValidationError } from '../../src/errors.js';
import { validator } from '../../src/middleware.js';

const inboundSchema = {
  type: 'object',
  properties: {
    inputValue: { type: 'number' },
  },
  required: ['inputValue'],
  additionalProperties: false,
};

const outboundSchema = {
  type: 'object',
  properties: {
    outputValue: { type: 'number' },
  },
  required: ['outputValue'],
  additionalProperties: false,
};

const baseHandler = async (event: { inputValue: unknown }) => {
  return {
    outputValue: event.inputValue,
  };
};

describe('Middleware: validator', () => {
  it('validates both inbound and outbound successfully', async () => {
    // Prepare
    const handler = middy(baseHandler).use(
      validator({ inboundSchema, outboundSchema })
    );

    // Act
    const result = await handler({ inputValue: 10 }, {} as Context);

    // Assess
    expect(result).toEqual({ outputValue: 10 });
  });

  it('throws an error on inbound validation failure', async () => {
    // Prepare
    const handler = middy(baseHandler).use(validator({ inboundSchema }));

    // Act & Assess
    await expect(
      handler({ inputValue: 'invalid' }, {} as Context)
    ).rejects.toThrow(
      new SchemaValidationError('Inbound schema validation failed', {
        cause: [
          expect.objectContaining({
            keyword: 'type',
            message: 'must be number',
          }),
        ],
      })
    );
  });

  it('throws an error on outbound validation failure', async () => {
    const handler = middy(() => {
      return 'invalid output';
    }).use(validator({ outboundSchema }));

    // Act & Assess
    await expect(handler({ inputValue: 10 }, {} as Context)).rejects.toThrow(
      new SchemaValidationError('Outbound schema validation failed', {
        cause: [
          expect.objectContaining({
            keyword: 'type',
            message: 'must be object',
          }),
        ],
      })
    );
  });

  it('skips validation when no schemas are provided', async () => {
    // Prepare
    const handler = middy(baseHandler).use(validator({}));

    // Act
    const result = await handler({ inputValue: 'bar' }, {} as Context);

    // Assess
    expect(result).toEqual({ outputValue: 'bar' });
  });
});
