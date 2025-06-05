import type { ZodTypeAny } from 'zod';

/**
 * Represents a Kafka consumer record.
 */
type ConsumerRecords<K, V> = {
  key: K;
  value: V;
  originalKey: string | undefined;
  originalValue: string | undefined;
  headers?: { [k: string]: string }[] | undefined;
  originalHeaders?: RecordHeader[] | undefined;
};

type SchemaType =
  | { type: 'json' }
  | { type: 'avro'; schemaStr: string; outputObject: ZodTypeAny | string }
  | { type: 'protobuf'; schemaStr: string; outputObject: string };

type SchemaConfig = {
  /**
   * Schema type for the key.
   * If not provided, the key will not be validated.
   */
  value: SchemaType;
  /**
   * Schema type for the value.
   * If not provided, the value will not be validated.
   */
  key?: SchemaType;
};

/**
 * This generic type is used to represent any function with any number of arguments and any return type.
 *
 * It's left intentionally open to allow for any function to be wrapped.
 */
// biome-ignore lint/suspicious/noExplicitAny: This is a generic type that is intentionally open
type AnyFunction = (...args: Array<any>) => any;

interface RecordHeader {
  [headerKey: string]: number[];
}

interface Record {
  topic: string;
  partition: number;
  offset: number;
  timestamp: number;
  timestampType: 'CREATE_TIME' | 'LOG_APPEND_TIME';
  key: string;
  value: string;
  headers: RecordHeader[];
}

// https://docs.aws.amazon.com/lambda/latest/dg/with-msk.html
interface MSKEvent {
  eventSource: 'aws:kafka';
  eventSourceArn: string;
  bootstrapServers: string;
  records: {
    [topic: string]: Record[];
  };
}

export type {
  AnyFunction,
  ConsumerRecords,
  SchemaConfig,
  SchemaType,
  MSKEvent,
  Record,
  RecordHeader,
};
