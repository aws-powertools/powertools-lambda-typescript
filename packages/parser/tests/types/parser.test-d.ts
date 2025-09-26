import middy from '@middy/core';
import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/eventbridge.js';
import { SqsEnvelope } from '../../src/envelopes/sqs.js';
import { JSONStringified } from '../../src/helpers/index.js';
import { parser } from '../../src/middleware/index.js';
import { parse } from '../../src/parser.js';

describe('Parser types', () => {
  const userSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  type User = z.infer<typeof userSchema>;

  it('infers return type for schema and safeParse', () => {
    // Act
    const result = parse({}, undefined, userSchema, true);

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
    const result = parse({}, undefined, userSchema);

    // Assess
    expectTypeOf(result).toEqualTypeOf<User>();
  });

  it('infers return type for schema and object envelope', () => {
    // Act
    const result = parse({}, EventBridgeEnvelope, userSchema);

    // Assess
    expectTypeOf(result).toEqualTypeOf<User>();
  });

  it('infers return type for schema and array envelope', () => {
    // Act
    const result = parse({}, SqsEnvelope, JSONStringified(userSchema));

    // Assess
    expectTypeOf(result).toEqualTypeOf<User[]>();
  });

  it('infers return type for schema, object envelope and safeParse $case', () => {
    // Act
    const result = parse({}, EventBridgeEnvelope, userSchema, true);

    // Assess
    expectTypeOf(result.success).toEqualTypeOf<boolean>();
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<User>();
    } else {
      expectTypeOf(result.error).toEqualTypeOf<Error>();
      expectTypeOf(result.originalEvent).toEqualTypeOf<unknown>();
    }
  });

  it('infers the return type when using parse middleware', () => {
    middy()
      .use(
        parser({
          schema: JSONStringified(userSchema),
          envelope: SqsEnvelope,
        })
      )
      .handler((event) => {
        expectTypeOf(event).toEqualTypeOf<User[]>();
      });
  });
});
