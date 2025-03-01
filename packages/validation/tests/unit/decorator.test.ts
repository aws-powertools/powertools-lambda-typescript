import { describe, expect, it } from 'vitest';
import { validator } from '../../src/decorator.js';
import { SchemaValidationError } from '../../src/errors.js';

const inboundSchema = {
  type: 'object',
  properties: {
    value: { type: 'number' },
  },
  required: ['value'],
  additionalProperties: false,
};

const outboundSchema = {
  type: 'object',
  properties: {
    result: { type: 'number' },
  },
  required: ['result'],
  additionalProperties: false,
};

describe('validator decorator', () => {
  it('should validate inbound and outbound successfully', async () => {
    // Prepare
    class TestClass {
      @validator({ inboundSchema, outboundSchema })
      async multiply(input: { value: number }): Promise<{ result: number }> {
        return { result: input.value * 2 };
      }
    }
    const instance = new TestClass();
    const input = { value: 5 };
    // Act
    const output = await instance.multiply(input);
    // Assess
    expect(output).toEqual({ result: 10 });
  });

  it('should throw error on inbound validation failure', async () => {
    // Prepare
    class TestClass {
      @validator({ inboundSchema, outboundSchema })
      async multiply(input: { value: number }): Promise<{ result: number }> {
        return { result: input.value * 2 };
      }
    }
    const instance = new TestClass();
    const invalidInput = { value: 'not a number' } as unknown as {
      value: number;
    };
    // Act & Assess
    await expect(instance.multiply(invalidInput)).rejects.toThrow(
      SchemaValidationError
    );
  });

  it('should throw error on outbound validation failure', async () => {
    // Prepare
    class TestClassInvalid {
      @validator({ inboundSchema, outboundSchema })
      async multiply(input: { value: number }): Promise<{ result: number }> {
        return { result: 'invalid' } as unknown as { result: number };
      }
    }
    const instance = new TestClassInvalid();
    const input = { value: 5 };
    // Act & Assess
    await expect(instance.multiply(input)).rejects.toThrow(
      SchemaValidationError
    );
  });

  it('should no-op when no schemas are provided', async () => {
    // Prepare
    class TestClassNoOp {
      @validator({})
      async echo(input: unknown): Promise<unknown> {
        return input;
      }
    }
    const instance = new TestClassNoOp();
    const data = { foo: 'bar' };
    // Act
    const result = await instance.echo(data);
    // Assess
    expect(result).toEqual(data);
  });

  it('should return descriptor unmodified if descriptor.value is undefined', () => {
    // Prepare
    const descriptor: PropertyDescriptor = {};
    // Act
    const result = validator({ inboundSchema })(
      null as unknown,
      'testMethod',
      descriptor
    );
    // Assess
    expect(result).toEqual(descriptor);
  });
});
