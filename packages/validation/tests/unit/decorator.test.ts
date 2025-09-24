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

describe('Decorator: validator', () => {
  it('should validate inbound and outbound successfully', () => {
    // Prepare
    class TestClass {
      @validator({ inboundSchema, outboundSchema })
      multiply(input: { value: number }): { result: number } {
        return { result: input.value * 2 };
      }
    }
    const instance = new TestClass();
    const input = { value: 5 };

    // Act
    const output = instance.multiply(input);

    // Assess
    expect(output).toEqual({ result: 10 });
  });

  it('should throw error on inbound validation failure', () => {
    // Prepare
    class TestClass {
      @validator({ inboundSchema, outboundSchema })
      multiply(input: { value: number }): { result: number } {
        return { result: input.value * 2 };
      }
    }
    const instance = new TestClass();
    const invalidInput = { value: 'not a number' } as unknown as {
      value: number;
    };

    // Act & Assess
    expect(instance.multiply(invalidInput)).toThrow(SchemaValidationError);
  });

  it('should throw error on outbound validation failure', () => {
    // Prepare
    class TestClassInvalid {
      @validator({ inboundSchema, outboundSchema })
      multiply(_input: { value: number }) {
        return { result: 'invalid' };
      }
    }
    const instance = new TestClassInvalid();

    // Act & Assess
    expect(instance.multiply({ value: 5 })).toThrow(SchemaValidationError);
  });

  it('should no-op when no schemas are provided', () => {
    // Prepare
    class TestClassNoOp {
      @validator({})
      echo(input: unknown): unknown {
        return input;
      }
    }
    const instance = new TestClassNoOp();
    const data = { foo: 'bar' };

    // Act
    const result = instance.echo(data);

    // Assess
    expect(result).toEqual(data);
  });

  it('should validate inbound only', () => {
    // Prepare
    class TestClassInbound {
      @validator({ inboundSchema })
      process(input: { value: number }): { data: string } {
        return { data: JSON.stringify(input) };
      }
    }
    const instance = new TestClassInbound();
    const input = { value: 10 };

    // Act
    const output = instance.process(input);

    // Assess
    expect(output).toEqual({ data: JSON.stringify(input) });
  });

  it('should validate outbound only', () => {
    // Prepare
    class TestClassOutbound {
      @validator({ outboundSchema })
      process(_input: { text: string }): { result: number } {
        return { result: 42 };
      }
    }
    const instance = new TestClassOutbound();
    const input = { text: 'hello' };

    // Act
    const output = instance.process(input);

    // Assess
    expect(output).toEqual({ result: 42 });
  });
});
