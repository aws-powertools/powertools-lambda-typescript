import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { EventType, SchemaVendor } from './constants.js';
import { ParsingError } from './errors.js';
import type {
  BatchProcessorConfig,
  EventSourceDataClassTypes,
} from './types.js';

/**
 * Extend the schema according to the event type passed.
 *
 * If `useTransformers` is true, extend using opinionated transformers.
 * Otherwise, extend without any transformers.
 *
 * The vendor is already checked at runtime to ensure Zod is being used when required using `StandardSchemaV1['~standard'].vendor`.
 *
 * @param options - The options for creating the extended schema
 * @param options.eventType - The type of event to process (SQS, Kinesis, DynamoDB)
 * @param options.innerSchema - The StandardSchema to be used for parsing. To avoid forcing a direct dependency on Zod, we use `unknown` here, which is not ideal but necessary.
 * @param options.useTransformers - Whether to use transformers for parsing
 * @param options.logger - A logger instance for logging
 */
const createExtendedSchema = async (options: {
  eventType: keyof typeof EventType;
  innerSchema: unknown;
  transformer?: BatchProcessorConfig['transformer'];
}) => {
  const { eventType, innerSchema, transformer } = options;
  let schema = innerSchema;
  switch (transformer) {
    case 'json': {
      const { JSONStringified } = await import(
        '@aws-lambda-powertools/parser/helpers'
      );
      // @ts-expect-error - we know it's a Zod schema due to the runtime check earlier
      schema = JSONStringified(innerSchema);
      break;
    }
    case 'base64': {
      const { Base64Encoded } = await import(
        '@aws-lambda-powertools/parser/helpers'
      );
      // @ts-expect-error - we know it's a Zod schema due to the runtime check earlier
      schema = Base64Encoded(innerSchema);
      break;
    }
    case 'unmarshall': {
      const { DynamoDBMarshalled } = await import(
        '@aws-lambda-powertools/parser/helpers/dynamodb'
      );
      // @ts-expect-error - we know it's a Zod schema due to the runtime check earlier
      schema = DynamoDBMarshalled(innerSchema);
      break;
    }
  }
  if (eventType === EventType.SQS) {
    const { SqsRecordSchema } = await import(
      '@aws-lambda-powertools/parser/schemas/sqs'
    );
    return SqsRecordSchema.extend({
      body: schema,
    });
  }
  if (eventType === EventType.KinesisDataStreams) {
    const { KinesisDataStreamRecord, KinesisDataStreamRecordPayload } =
      await import('@aws-lambda-powertools/parser/schemas/kinesis');
    return KinesisDataStreamRecord.extend({
      kinesis: KinesisDataStreamRecordPayload.extend({
        data: schema,
      }),
    });
  }

  const { DynamoDBStreamRecord, DynamoDBStreamChangeRecordBase } = await import(
    '@aws-lambda-powertools/parser/schemas/dynamodb'
  );
  return DynamoDBStreamRecord.extend({
    dynamodb: DynamoDBStreamChangeRecordBase.extend({
      OldImage: schema,
      NewImage: schema,
    }),
  });
};

/**
 * Parse the record with the passed schema and
 * return the result or throw the error depending on parsing success
 *
 * @param record - The record to be parsed
 * @param schema - The modified schema to parse with
 * @param logger - A logger instance for logging
 */
const parseWithErrorHandling = async (
  record: EventSourceDataClassTypes,
  schema: StandardSchemaV1,
  logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>
) => {
  const { parse } = await import('@aws-lambda-powertools/parser');
  const result = parse(record, undefined, schema, true);
  if (result.success) {
    return result.data as EventSourceDataClassTypes;
  }
  const issues = result.error.cause as ReadonlyArray<StandardSchemaV1.Issue>;
  const errorMessage = issues
    .map((issue) => `${issue.path?.join('.')}: ${issue.message}`)
    .join('; ');
  logger.debug(`Failed to parse record: ${errorMessage}`);
  throw new ParsingError(errorMessage);
};

/**
 * Parse the record according to the schema and event type passed.
 *
 * If the passed schema is already an extended schema,
 * use the schema directly to parse the record.
 *
 * Parts of the parser integration within BatchProcessor rely on Zod for schema transformations,
 * however some other parts also support other Standard Schema-compatible libraries.
 *
 * @param record - The record to be parsed
 * @param eventType - The type of event to process
 * @param logger - A logger instance for logging
 * @param parserConfig - The parser configuration options
 */
const parser = async (
  record: EventSourceDataClassTypes,
  eventType: keyof typeof EventType,
  logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>,
  parserConfig: BatchProcessorConfig
): Promise<EventSourceDataClassTypes> => {
  const { schema, innerSchema, transformer } = parserConfig;
  // If the external schema is specified, use it to parse the record
  if (schema) {
    return parseWithErrorHandling(record, schema, logger);
  }
  if (innerSchema) {
    // Only proceed with schema extension if it's a Zod schema
    if (innerSchema['~standard'].vendor !== SchemaVendor.Zod) {
      logger.error(
        'The schema provided is not supported. Only Zod schemas are supported for extension.'
      );
      throw new ParsingError('Unsupported schema type');
    }
    return parseWithErrorHandling(
      record,
      await createExtendedSchema({
        eventType,
        innerSchema,
        ...(transformer ? { transformer } : {}),
      }),
      logger
    );
  }
  logger.error('There was no schema or innerSchema provided');
  throw new ParsingError(
    'Either schema or innerSchema is required for parsing'
  );
};

export { parser };
