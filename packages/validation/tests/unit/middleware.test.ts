import middy from '@middy/core';
import { describe, expect, it } from 'vitest';
import { SchemaValidationError } from '../../src/errors.js';
import { validation } from '../../src/middleware.js';

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

const response = { outputValue: 20 };
const baseHandler = async (event: unknown) => {
  return response;
};

describe('validation middleware with Middy', () => {
  it('should validate inbound and outbound successfully', async () => {
    // Prepare
    const middleware = validation({ inboundSchema, outboundSchema });
    const wrappedHandler = middy(baseHandler).use(middleware);
    const event = { inputValue: 10 };
    // Act
    const result = await wrappedHandler(event);
    // Assess
    expect(result).toEqual(response);
  });

  it('should throw error on inbound validation failure', async () => {
    // Prepare
    const middleware = validation({ inboundSchema });
    const wrappedHandler = middy(baseHandler).use(middleware);
    const invalidEvent = { inputValue: 'invalid' };
    // Act & Assess
    await expect(wrappedHandler(invalidEvent)).rejects.toThrow(
      SchemaValidationError
    );
  });

  it('should throw error on outbound validation failure', async () => {
    const invalidHandler = async (_event: unknown) => {
      return { outputValue: 'invalid' };
    };
    const middleware = validation({ outboundSchema });
    const wrappedHandler = middy(invalidHandler).use(middleware);
    const event = { any: 'value' };
    // Act & Assess
    await expect(wrappedHandler(event)).rejects.toThrow(SchemaValidationError);
  });

  it('should no-op when no schemas are provided', async () => {
    // Prepare
    const middleware = validation({});
    const wrappedHandler = middy(baseHandler).use(middleware);
    const event = { anyKey: 'anyValue' };
    // Act
    const result = await wrappedHandler(event);
    // Assess
    expect(result).toEqual(response);
  });
});
