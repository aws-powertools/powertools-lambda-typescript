import { describe, expect, it } from 'vitest';
import { SchemaValidationError } from '../../src/errors.js';
import { validationMiddleware } from '../../src/middleware.js';

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

describe('validatorMiddleware', () => {
  it('should validate inbound and outbound successfully', async () => {
    // Prepare
    const middleware = validationMiddleware({ inboundSchema, outboundSchema });
    const handler = {
      event: { inputValue: 10 },
      response: { outputValue: 20 },
    };
    // Act
    if (middleware.before) {
      await middleware.before(handler);
    }
    if (middleware.after) {
      await middleware.after(handler);
    }
    // Assess
    expect(handler.event).toEqual({ inputValue: 10 });
    expect(handler.response).toEqual({ outputValue: 20 });
  });

  it('should throw error on inbound validation failure', async () => {
    // Prepare
    const middleware = validationMiddleware({ inboundSchema });
    const handler = {
      event: { inputValue: 'invalid' },
      response: {},
    };
    // Act & Assess
    await expect(middleware.before?.(handler)).rejects.toThrow(
      SchemaValidationError
    );
  });

  it('should throw error on outbound validation failure', async () => {
    // Prepare
    const middleware = validationMiddleware({ outboundSchema });
    const handler = {
      event: {},
      response: { outputValue: 'invalid' },
    };
    // Act & Assess
    await expect(middleware.after?.(handler)).rejects.toThrow(
      SchemaValidationError
    );
  });

  it('should no-op when no schemas are provided', async () => {
    // Prepare
    const middleware = validationMiddleware({});
    const handler = {
      event: { someKey: 'value' },
      response: { anotherKey: 'value' },
    };
    // Act
    if (middleware.before) {
      await middleware.before(handler);
    }
    if (middleware.after) {
      await middleware.after(handler);
    }
    // Assess
    expect(handler.event).toEqual({ someKey: 'value' });
    expect(handler.response).toEqual({ anotherKey: 'value' });
  });
});
