import type { MessageType } from '@protobuf-ts/runtime';
import type { ZodTypeAny } from 'zod';

/**
 * Represents a Kafka consumer record.
 */
type ConsumerRecord<K, V> = {
  key: K;
  value: V;
  originalKey: string | undefined;
  originalValue: string | undefined;
  headers?: { [k: string]: string }[] | undefined | null;
  originalHeaders?: RecordHeader[] | undefined;
};

type ConsumerRecords<K, V> = {
  records: Array<ConsumerRecord<K, V>>;
} & Omit<MSKEvent, 'records'>;

type SchemaType = JsonConfig | AvroConfig | ProtobufConfig<object>;

type JsonConfig = { type: 'json'; zodSchema?: ZodTypeAny };

type AvroConfig = {
  type: 'avro';
  schema: string;
  zodSchema?: ZodTypeAny;
};
type ProtobufConfig<T extends object> = {
  type: 'protobuf';
  schema: MessageType<T>;
  zodSchema?: ZodTypeAny;
};

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
  ConsumerRecord,
  SchemaConfig,
  SchemaType,
  MSKEvent,
  Record,
  RecordHeader,
};
