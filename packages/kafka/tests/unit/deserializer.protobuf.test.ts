import type { Message } from 'protobufjs';
import { describe, expect, it } from 'vitest';
import { deserialize } from '../../src/deserializer/protobuf.js';
import { KafkaConsumerDeserializationError } from '../../src/errors.js';
import type { ProtobufMessage } from '../../src/types.js';
import { Product } from '../protos/product.es6.generated.js';

describe('Protobuf deserialiser: ', () => {
  it('throws when protobuf serialise fails', () => {
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const invalidType = {} as ProtobufMessage<Message>;

    expect(() => deserialize(data, invalidType)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('returns protobuf deserialised value', () => {
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const expected = { id: 1001, name: 'Laptop', price: 999.99 };

    expect(deserialize(data, Product)).toEqual(expected);
  });
});
