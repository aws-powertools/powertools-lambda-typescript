import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { ApiGatewayEnvelope } from '../../src/envelopes/api-gateway.js';
import { ApiGatewayV2Envelope } from '../../src/envelopes/api-gatewayv2.js';
import { CloudWatchEnvelope } from '../../src/envelopes/cloudwatch.js';
import type { DynamoDBStreamEnvelope } from '../../src/envelopes/dynamodb.js';
import { EventBridgeEnvelope } from '../../src/envelopes/eventbridge.js';
import { KafkaEnvelope } from '../../src/envelopes/kafka.js';
import { KinesisEnvelope } from '../../src/envelopes/kinesis.js';
import { KinesisFirehoseEnvelope } from '../../src/envelopes/kinesis-firehose.js';
import { LambdaFunctionUrlEnvelope } from '../../src/envelopes/lambda.js';
import { SnsEnvelope } from '../../src/envelopes/sns.js';
import { SnsSqsEnvelope } from '../../src/envelopes/sns-sqs.js';
import { SqsEnvelope } from '../../src/envelopes/sqs.js';
import { VpcLatticeEnvelope } from '../../src/envelopes/vpc-lattice.js';
import { VpcLatticeV2Envelope } from '../../src/envelopes/vpc-latticev2.js';
import type { DynamoDBStreamEnvelopeResponse } from '../../src/types/envelope.js';
import type { ParserOutput } from '../../src/types/parser.js';

describe('Types ', () => {
  // biome-ignore lint/correctness/noUnusedVariables: used in typeof expressions for type tests
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
    // biome-ignore lint/correctness/noUnusedFunctionParameters: used in typeof expressions for type tests
  ])('infers object types for $name envelope', ({ envelope }) => {
    // Prepare
    type Result = ParserOutput<typeof userSchema, typeof envelope>;

    // Act
    const result = { name: 'John', age: 30 } satisfies Result;

    // Assess
    expectTypeOf(result).toEqualTypeOf<z.infer<typeof userSchema>>();
  });

  it.each([
    { envelope: CloudWatchEnvelope, name: 'CloudWatch' },
    { envelope: KafkaEnvelope, name: 'Kafka' },
    { envelope: KinesisFirehoseEnvelope, name: 'KinesisFirehose' },
    { envelope: KinesisEnvelope, name: 'Kinesis' },
    { envelope: SqsEnvelope, name: 'Sqs' },
    { envelope: SnsEnvelope, name: 'Sns' },
    { envelope: SnsSqsEnvelope, name: 'SnsSqs' },
    // biome-ignore lint/correctness/noUnusedFunctionParameters: used in typeof expressions for type tests
  ])('infers array types with $name envelope', ({ envelope }) => {
    // Prepare
    type Result = ParserOutput<typeof userSchema, typeof envelope>;

    // Act
    const result = [{ name: 'John', age: 30 }] satisfies Result;

    // Assess
    expectTypeOf(result).toEqualTypeOf<z.infer<typeof userSchema>[]>();
  });

  it('infers DynamoDB stream envelope response type', () => {
    // Prepare
    type Result = ParserOutput<
      typeof userSchema,
      typeof DynamoDBStreamEnvelope
    >;

    // Act
    const result: Result = [
      {
        NewImage: { name: 'John', age: 30 },
      },
      {
        OldImage: { name: 'Jane', age: 25 },
      },
    ];

    // Assess
    expectTypeOf(result).toEqualTypeOf<
      DynamoDBStreamEnvelopeResponse<z.infer<typeof userSchema>>[]
    >();
  });
});
