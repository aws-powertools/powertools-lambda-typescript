import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  ApiGatewayEnvelope,
  ApiGatewayV2Envelope,
  CloudWatchEnvelope,
  DynamoDBStreamEnvelope,
  EventBridgeEnvelope,
  KafkaEnvelope,
  KinesisEnvelope,
  KinesisFirehoseEnvelope,
  LambdaFunctionUrlEnvelope,
  SnsEnvelope,
  SnsSqsEnvelope,
  SqsEnvelope,
  VpcLatticeEnvelope,
  VpcLatticeV2Envelope,
} from '../../src/envelopes/index.js';
import { parse } from '../../src/parser.js';
import type { ParsedResult, ParserOutput } from '../../src/types/parser.js';

describe('Types ', () => {
  const userSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it.each([
    { envelope: ApiGatewayEnvelope, name: 'ApiGateway' },
    { envelope: ApiGatewayV2Envelope, name: 'ApiGatewayV2' },
    { envelope: EventBridgeEnvelope, name: 'EventBridge' },
    { envelope: LambdaFunctionUrlEnvelope, name: 'LambdaFunctionUrl' },
    { envelope: VpcLatticeEnvelope, name: 'VpcLattice' },
    { envelope: VpcLatticeV2Envelope, name: 'VpcLatticeV2' },
  ])('infers object types for $name envelope', (testCase) => {
    type Result = ParserOutput<typeof userSchema, typeof testCase.envelope>;
    // Define the expected type

    // This will fail TypeScript compilation if Result is is an array
    const result = { name: 'John', age: 30 } satisfies Result;

    // Runtime checks to ensure it's an array with single element
    expect(Array.isArray(result)).toBe(false);
    expect(result).toEqual({ name: 'John', age: 30 });

    // Type assertion to ensure it's specifically User[]
    type AssertIsUserArray<T> = T extends z.infer<typeof userSchema>[]
      ? true
      : false;
    type Test = AssertIsUserArray<Result>;
  });

  it.each([
    { envelope: CloudWatchEnvelope, name: 'CloudWatch' },
    { envelope: DynamoDBStreamEnvelope, name: 'DynamoDBStream' },
    { envelope: KafkaEnvelope, name: 'Kafka' },
    { envelope: KinesisFirehoseEnvelope, name: 'KinesisFirehose' },
    { envelope: KinesisEnvelope, name: 'Kinesis' },
    { envelope: SqsEnvelope, name: 'Sqs' },
    { envelope: SnsEnvelope, name: 'Sns' },
    { envelope: SnsSqsEnvelope, name: 'SnsSqs' },
  ])('infers array types with $name envelope', (testCase) => {
    // Define the expected type
    type Result = ParserOutput<typeof userSchema, typeof testCase.envelope>;

    // This will fail TypeScript compilation if Result is is an array
    const result = [{ name: 'John', age: 30 }] satisfies Result;

    // Runtime checks to ensure it's an array with single element
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([{ name: 'John', age: 30 }]);

    expectTypeOf(result).toEqualTypeOf<z.infer<typeof userSchema>[]>();
  });

  it('infers types of schema and safeParse result', () => {
    // Prepare
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const input = { name: 'John', age: 30 };
    type User = z.infer<typeof userSchema>;
    type Result = ParsedResult<User>;

    // Act
    const result = parse(input, undefined, schema, true) as ParsedResult<User>;

    // Assert
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<User>();
    } else {
      expectTypeOf(result.originalEvent).toEqualTypeOf<User | undefined>();
    }
  });
});
