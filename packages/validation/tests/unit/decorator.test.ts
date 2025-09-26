import { setTimeout } from 'node:timers/promises';
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
  it('validates both inbound and outbound successfully', async () => {
    // Prepare
    class TestClass {
      @validator({ inboundSchema, outboundSchema })
      async multiply(input: { value: number }): Promise<{ result: number }> {
        await setTimeout(1); // simulate some processing time
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

  it('throws an error on inbound validation failure', async () => {
    // Prepare
    class TestClass {
      @validator({ inboundSchema, outboundSchema })
      async multiply(input: { value: number }): Promise<{ result: number }> {
        await setTimeout(1); // simulate some processing time
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

  it('throws an error on outbound validation failure', async () => {
    // Prepare
    class TestClassInvalid {
      @validator({ inboundSchema, outboundSchema })
      async multiply(_input: { value: number }) {
        await setTimeout(1); // simulate some processing time
        return { result: 'invalid' };
      }
    }
    const instance = new TestClassInvalid();

    // Act & Assess
    await expect(instance.multiply({ value: 5 })).rejects.toThrow(
      SchemaValidationError
    );
  });

  it('results in a no-op when no schemas are provided', async () => {
    // Prepare
    class TestClassNoOp {
      @validator({})
      async echo(input: unknown): Promise<unknown> {
        await setTimeout(1); // simulate some processing time
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

  it('validates the inbound schema only', async () => {
    // Prepare
    class TestClassInbound {
      @validator({ inboundSchema })
      async process(input: { value: number }): Promise<{ data: string }> {
        await setTimeout(1); // simulate some processing time
        return { data: JSON.stringify(input) };
      }
    }
    const instance = new TestClassInbound();
    const input = { value: 10 };

    // Act
    const output = await instance.process(input);

    // Assess
    expect(output).toEqual({ data: JSON.stringify(input) });
  });

  it('validates the outbound schema only', async () => {
    // Prepare
    class TestClassOutbound {
      @validator({ outboundSchema })
      async process(_input: { text: string }): Promise<{ result: number }> {
        await setTimeout(1); // simulate some processing time
        return { result: 42 };
      }
    }
    const instance = new TestClassOutbound();
    const input = { text: 'hello' };

    // Act
    const output = await instance.process(input);

    // Assess
    expect(output).toEqual({ result: 42 });
  });
});
