import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/index.js';
import { ParseError } from '../../src/errors.js';
import { parser } from '../../src/index.js';
import { EventBridgeSchema } from '../../src/schemas/index.js';
import { TestSchema, getTestEvent } from './helpers/utils.js';

class MockLambda {
  protected echo(event: unknown) {
    return event;
  }
}

describe('Parser Decorator', () => {
  const event = {
    ...getTestEvent({
      eventsPath: 'eventbridge',
      filename: 'base',
    }),
    detail: {
      name: 'John',
      age: 42,
    },
  };
  type TestEvent = z.infer<typeof TestSchema>;

  it('parses the event using the provided schema', async () => {
    // Prepare
    const schema = EventBridgeSchema.extend({
      detail: TestSchema,
    });
    class Mock extends MockLambda implements LambdaInterface {
      @parser({ schema })
      public async handler(event: unknown, _context = {} as Context) {
        return this.echo(event);
      }
    }

    // Act
    const response = await new Mock().handler(event);

    // Assess
    expect(response).toEqual(event);
  });

  it('extracts the paylaod from the envelope', async () => {
    // Prepare
    class Mock extends MockLambda implements LambdaInterface {
      @parser({ schema: TestSchema, envelope: EventBridgeEnvelope })
      public async handler(event: unknown, _context = {} as Context) {
        return this.echo(event);
      }
    }

    // Act
    const response = await new Mock().handler(event);

    // Assess
    expect(response).toEqual(event.detail);
  });

  it.each([
    {
      case: 'with valid event',
      event,
      expected: { success: true, data: event },
    },
    {
      case: 'with invalid event',
      event: { foo: 'bar' },
      expected: {
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      },
    },
    {
      options: { envelope: EventBridgeEnvelope },
      case: 'with envelope',
      event,
      expected: { success: true, data: event.detail },
    },
    {
      options: { envelope: EventBridgeEnvelope },
      case: 'with envelope and invalid event',
      event: { foo: 'bar' },
      expected: {
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      },
    },
  ])(
    'parses the event with safeParse $case',
    async ({ options, event, expected }) => {
      // Prepare
      const schema = options?.envelope
        ? TestSchema
        : EventBridgeSchema.extend({
            detail: TestSchema,
          });
      class Mock extends MockLambda implements LambdaInterface {
        @parser({ schema, safeParse: true, ...options })
        public async handler(event: unknown, _context = {} as Context) {
          return this.echo(event);
        }
      }

      // Act
      const response = await new Mock().handler(event);

      // Assess
      expect(response).toEqual(expected);
    }
  );
});
