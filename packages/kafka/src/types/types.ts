import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Reader } from 'protobufjs';
import type { SchemaType as SchemaTypeMap } from '../constants.js';

/**
 * Represents a single Kafka consumer record with generic key and value types.
 */
type ConsumerRecord<K, V> = {
  /**
   * The deserialized key of the record
   */
  key: K;
  /**
   * The deserialized value of the record
   */
  value: V;
  /**
   * The original (raw, encoded) key as received from Kafka, or `undefined` if not present
   */
  originalKey?: string;
  /**
   * The original (raw, encoded) value as received from Kafka
   */
  originalValue: string;
  /**
   * Optional array of headers as key-value string pairs, or `null/`undefined` if not present
   */
  headers?: { [k: string]: string }[] | null;
  /**
   * Optional array of original record headers
   */
  originalHeaders?: RecordHeader[] | null;
  /**
   * The topic from which the record was consumed
   */
  topic: string;
  /**
   * The partition from which the record was consumed
   */
  partition: number;
  /**
   * The offset of the record within the partition
   */
  offset: number;
  /**
   * The timestamp of the record
   */
  timestamp: number;
  /**
   * The type of timestamp (CREATE_TIME or LOG_APPEND_TIME)
   */
  timestampType: 'CREATE_TIME' | 'LOG_APPEND_TIME';
};

/**
 * Represents a collection of Kafka consumer records, along with MSK event metadata.
 */
type ConsumerRecords<K = unknown, V = unknown> = {
  /**
   * Array of consumer records
   */
  records: Array<ConsumerRecord<K, V>>;
} & Omit<MSKEvent, 'records'>;

/**
 * Union type for supported schema types (JSON, Avro, Protobuf).
 */
type SchemaType = (typeof SchemaTypeMap)[keyof typeof SchemaTypeMap];

/**
 * Union type for supported schema configurations (JSON, Avro, Protobuf).
 */
type SchemaConfigValue = JsonConfig | AvroConfig | ProtobufConfig<unknown>;

/**
 * Configuration for JSON schema validation.
 */
type JsonConfig = {
  /**
   * Indicates the schema type is JSON
   */
  type: typeof SchemaTypeMap.JSON;
  /**
   * Optional {@link https://github.com/standard-schema/standard-schema | Standard Schema} for runtime validation
   */
  parserSchema?: StandardSchemaV1;
};

/**
 * Configuration for Avro schema validation.
 */
type AvroConfig = {
  /**
   * Indicates the schema type is Avro
   */
  type: typeof SchemaTypeMap.AVRO;
  /**
   * Avro schema definition as a string
   */
  schema: string;
  /**
   * Optional {@link https://github.com/standard-schema/standard-schema | Standard Schema} for runtime validation
   */
  parserSchema?: StandardSchemaV1;
};

/**
 * Configuration for Protobuf schema validation.
 */
type ProtobufConfig<T> = {
  /**
   * Indicates the schema type is Protobuf
   */
  type: typeof SchemaTypeMap.PROTOBUF;
  /**
   * Protobuf message type for decoding
   */
  schema: ProtobufMessage<T>;
  /**
   * Optional {@link https://github.com/standard-schema/standard-schema | Standard Schema} for runtime validation
   */
  parserSchema?: StandardSchemaV1;
};

/**
 * Configuration for key and value schema validation.
 */
type SchemaConfig = {
  /**
   * Schema type for the value.
   * If not provided, the value will not be validated.
   */
  value: SchemaConfigValue;
  /**
   * Schema type for the key.
   * If not provided, the key will not be validated.
   */
  key?: SchemaConfigValue;
};

/**
 * Represents a Kafka record header as a mapping of header key to byte array.
 */
interface RecordHeader {
  /**
   * Header key mapped to its value as an array of bytes
   */
  [headerKey: string]: number[];
}

/**
 * Represents a single Kafka record as received from MSK.
 */
interface Record {
  /**
   * Kafka topic name
   */
  topic: string;
  /**
   * Partition number within the topic
   */
  partition: number;
  /**
   * Offset of the record within the partition
   */
  offset: number;
  /**
   * Timestamp of the record
   */
  timestamp: number;
  /**
   * Type of timestamp (creation or log append time)
   */
  timestampType: 'CREATE_TIME' | 'LOG_APPEND_TIME';
  /**
   * Base64-encoded key of the record
   */
  key: string;
  /**
   * Base64-encoded value of the record
   */
  value: string;
  /**
   * Array of record headers
   */
  headers: RecordHeader[];
}

/**
 * AWS Lambda event structure for MSK (Managed Streaming for Kafka).
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/with-msk.html | AWS Lambda with MSK}
 */
interface MSKEvent {
  /**
   * Event source identifier (always 'aws:kafka')
   */
  eventSource: 'aws:kafka';
  /**
   * ARN of the Kafka event source
   */
  eventSourceArn: string;
  /**
   * Comma-separated list of Kafka bootstrap servers
   */
  bootstrapServers: string;
  /**
   * Mapping of topic names to arrays of records
   */
  records: {
    [topic: string]: Record[];
  };
}

interface ProtobufMessage<T> {
  decode(reader: Reader | Uint8Array, length?: number): T;
}

type Deserializer = (input: string, schema?: unknown) => unknown;

export type {
  ConsumerRecord,
  ConsumerRecords,
  Deserializer,
  MSKEvent,
  ProtobufMessage,
  Record,
  RecordHeader,
  SchemaType,
  SchemaConfig,
  SchemaConfigValue,
};
