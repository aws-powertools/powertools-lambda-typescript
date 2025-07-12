import { describe } from 'node:test';
import { expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/eventbridge.js';
import { SqsEnvelope } from '../../src/envelopes/sqs.js';
import { JSONStringified } from '../../src/helpers/index.js';
import { parse } from '../../src/parser.js';
import type { EventBridgeEvent, SqsEvent } from '../../src/types/schema.js';
import { getTestEvent } from '../unit/helpers/utils.js';

describe('Parser types', () => {
  const userSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  type User = z.infer<typeof userSchema>;
  const input = { name: 'John', age: 30 };
  const eventBridgeBaseEvent = getTestEvent<EventBridgeEvent>({
    eventsPath: 'eventbridge',
    filename: 'base',
  });
  const sqsBaseEvent = getTestEvent<SqsEvent>({
    eventsPath: 'sqs',
    filename: 'base',
  });

  it.each([
    {
      input,
      case: 'when parsing successfully',
    },
    {
      input: { name: 'John', age: '30' }, // Invalid input for User schema
      case: 'when parsing fails',
    },
  ])('infers return type for schema and safeParse $case', ({ input }) => {
    // Act
    const result = parse(input, undefined, userSchema, true);

    // Assess
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<User>();
    } else {
      expectTypeOf(result.error).toEqualTypeOf<Error>();
      expectTypeOf(result.originalEvent).toEqualTypeOf<unknown>();
    }
  });

  it('infers return type for schema', () => {
    // Act
    const result = parse(input, undefined, userSchema);

    // Assess
    expectTypeOf(result).toEqualTypeOf<User>();
  });

  it('infers return type for schema and object envelope', () => {
    // Prepare
    const event = structuredClone(eventBridgeBaseEvent);
    event.detail = input;

    // Act
    const result = parse(event, EventBridgeEnvelope, userSchema);

    // Assess
    expectTypeOf(result).toEqualTypeOf<User>();
  });

  it('infers return type for schema and array envelope', () => {
    // Prepare
    const event = structuredClone(sqsBaseEvent);
    event.Records[0].body = JSON.stringify(input);
    event.Records[1].body = JSON.stringify(input);

    // Act
    const result = parse(event, SqsEnvelope, JSONStringified(userSchema));

    // Assess
    expectTypeOf(result).toEqualTypeOf<User[]>();
  });

  it.each([
    {
      input,
      case: 'when parsing successfully',
    },
    {
      input: { name: 'John', age: '30' }, // Invalid input for User schema
      case: 'when parsing fails',
    },
  ])(
    'infers return type for schema, object envelope and safeParse $case',
    ({ input }) => {
      // Prepare
      const event = structuredClone(eventBridgeBaseEvent);
      event.detail = input;

      // Act
      const result = parse(event, EventBridgeEnvelope, userSchema, true);

      // Assess
      expectTypeOf(result.success).toEqualTypeOf<boolean>();
      if (result.success) {
        expectTypeOf(result.data).toEqualTypeOf<User>();
      } else {
        expectTypeOf(result.error).toEqualTypeOf<Error>();
        expectTypeOf(result.originalEvent).toEqualTypeOf<unknown>();
      }
    }
  );
});
