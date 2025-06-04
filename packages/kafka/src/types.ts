import type { ZodTypeAny } from 'zod';

type SchemaType = 'json' | 'avro' | 'protobuf';

/**
 * Represents a Kafka consumer record.
 */
type ConsumerRecords<K, V> = {
  key: K;
  value: V;
  originalKey: string | undefined;
  originalValue: string | undefined;
  headers?: Array<[string, Uint8Array]> | null; // TODO: add headers
  originalHeaders?: Array<[string, Uint8Array]> | null; //TODO: add headers
};

type SchemaConfigValue = {
  /**
   * Type of the provided schema
   */
  type: SchemaType;
  /**
   * Schema definition as string.
   * Required only when type set to AVRO or PROTOBUF
   */
  schemaStr?: string;
  /**
   * Custom serializer for message values. Can be:
   *   - zod schema
   *   - ajv schema
   *   - custom serializer function
   */
  outputObject: ZodTypeAny | string | unknown; // object, but not clear what exact shape
};

type SchemaConfig = {
  /**
   * Schema type for the key.
   * If not provided, the key will not be validated.
   */
  value: SchemaConfigValue;
  /**
   * Schema type for the value.
   * If not provided, the value will not be validated.
   */
  key?: SchemaConfigValue;
};

/**
 * This generic type is used to represent any function with any number of arguments and any return type.
 *
 * It's left intentionally open to allow for any function to be wrapped.
 */
// biome-ignore lint/suspicious/noExplicitAny: This is a generic type that is intentionally open
type AnyFunction = (...args: Array<any>) => any;

export type {
  AnyFunction,
  ConsumerRecords,
  SchemaConfig,
  SchemaConfigValue,
  SchemaType,
};
