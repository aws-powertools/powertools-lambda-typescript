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
import type { ParserOutput } from '../../src/types/parser';

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
  ])('should infer object for $name envelope', (testCase) => {
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
  ])('should infer array type with $name envelope', (testCase) => {
    // Define the expected type
    type Result = ParserOutput<typeof userSchema, typeof testCase.envelope>;

    // This will fail TypeScript compilation if Result is is an array
    const result = [{ name: 'John', age: 30 }] satisfies Result;

    // Runtime checks to ensure it's an array with single element
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([{ name: 'John', age: 30 }]);

    // Type assertion to ensure it's specifically User[]
    type AssertIsUserArray<T> = T extends z.infer<typeof userSchema>[]
      ? true
      : false;
    type Test = AssertIsUserArray<Result>;
  });
});
