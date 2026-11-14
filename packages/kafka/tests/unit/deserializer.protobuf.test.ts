import type { Message } from 'protobufjs';
import { beforeAll, describe, expect, it } from 'vitest';
import { createDeserializer } from '../../src/deserializer/protobuf.js';
import { KafkaConsumerDeserializationError } from '../../src/errors.js';
import type { ProtobufMessage } from '../../src/types/types.js';
import { Product } from '../protos/product.generated.js';

describe('Protobuf deserialiser: ', () => {
  let deserialize: Awaited<ReturnType<typeof createDeserializer>>;

  beforeAll(async () => {
    deserialize = await createDeserializer();
  });

  it('throws when protobuf serialise fails', () => {
    // Prepare
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const invalidType = {} as ProtobufMessage<Message>;
    const schemaMetadata = {
      dataFormat: 'PROTOBUF',
    };

    // Act & Assess
    expect(() => deserialize(data, invalidType, schemaMetadata)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('returns protobuf deserialised value', () => {
    // Prepare
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const expected = { id: 1001, name: 'Laptop', price: 999.99 };
    const schemaMetadata = {
      dataFormat: 'PROTOBUF',
    };

    // Act
    const result = deserialize(data, Product, schemaMetadata);

    // Assess
    expect(result).toEqual(expected);
  });

  it.each([
    { indexes: '[0]', data: 'AAjpBxIGTGFwdG9wGVK4HoXrP49A' },
    { indexes: '[1]', data: 'AgII6QcSBkxhcHRvcBlSuB6F6z+PQA==' },
    { indexes: '[2]', data: 'AgQI6QcSBkxhcHRvcBlSuB6F6z+PQA==' },
    { indexes: '[1, 0]', data: 'BAIACOkHEgZMYXB0b3AZUrgehes/j0A=' },
    { indexes: '[70]', data: 'AowBCOkHEgZMYXB0b3AZUrgehes/j0A=' },
  ])(
    'skips the Confluent message indexes $indexes before decoding',
    ({ data }) => {
      // Prepare
      const expected = { id: 1001, name: 'Laptop', price: 999.99 };
      const schemaMetadata = {
        dataFormat: 'PROTOBUF',
        schemaId: '1',
      };

      // Act
      const result = deserialize(data, Product, schemaMetadata);

      // Assess
      expect(result).toEqual(expected);
    }
  );

  it('throws if the Confluent message index count is negative', () => {
    // Prepare
    const data = 'AQjpBxIGTGFwdG9wGVK4HoXrP49A'; // 0x01 (zigzag -1) + the Product payload
    const schemaMetadata = {
      dataFormat: 'PROTOBUF',
      schemaId: '1',
    };

    // Act & Assess
    expect(() => deserialize(data, Product, schemaMetadata)).toThrow(
      'Invalid Confluent message index array length: -1'
    );
  });

  it('throws if unable to parse a Confluent Schema Registry protobuf', () => {
    // Prepare
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const schemaMetadata = {
      dataFormat: 'PROTOBUF',
      schemaId: '1',
    };

    // Act & Assess
    expect(() => deserialize(data, Product, schemaMetadata)).toThrow(
      KafkaConsumerDeserializationError
    );
  });
});
