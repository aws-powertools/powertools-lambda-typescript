import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { ApiGatewayEnvelope } from '../../src/envelopes/api-gateway.js';
import { ApiGatewayV2Envelope } from '../../src/envelopes/api-gatewayv2.js';
import { CloudWatchEnvelope } from '../../src/envelopes/cloudwatch.js';
import { DynamoDBStreamEnvelope } from '../../src/envelopes/dynamodb.js';
import { EventBridgeEnvelope } from '../../src/envelopes/eventbridge.js';
import { KafkaEnvelope } from '../../src/envelopes/kafka.js';
import { KinesisFirehoseEnvelope } from '../../src/envelopes/kinesis-firehose.js';
import { KinesisEnvelope } from '../../src/envelopes/kinesis.js';
import { LambdaFunctionUrlEnvelope } from '../../src/envelopes/lambda.js';
import { SnsSqsEnvelope } from '../../src/envelopes/sns-sqs.js';
import { SnsEnvelope } from '../../src/envelopes/sns.js';
import { SqsEnvelope } from '../../src/envelopes/sqs.js';
import { VpcLatticeEnvelope } from '../../src/envelopes/vpc-lattice.js';
import { VpcLatticeV2Envelope } from '../../src/envelopes/vpc-latticev2.js';
import type { ParserOutput } from '../../src/types/parser.js';

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
});
