import type { Message } from 'protobufjs';
import { describe, expect, it } from 'vitest';
import { deserialize } from '../../src/deserializer/protobuf.js';
import { KafkaConsumerDeserializationError } from '../../src/errors.js';
import type { ProtobufMessage } from '../../src/types/types.js';
import { Product } from '../protos/product.es6.generated.js';

describe('Protobuf deserialiser: ', () => {
  it('throws when protobuf serialise fails', () => {
    // Prepare
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const invalidType = {} as ProtobufMessage<Message>;

    // Act & Assess
    expect(() => deserialize(data, invalidType)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('returns protobuf deserialised value', () => {
    // Prepare
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const expected = { id: 1001, name: 'Laptop', price: 999.99 };

    // Act & Assess
    expect(deserialize(data, Product)).toEqual(expected);
  });
});
