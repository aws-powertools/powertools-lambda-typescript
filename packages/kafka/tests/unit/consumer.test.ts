import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { KafkaConsumerMissingSchemaError } from '../../src/errors.js';
import { SchemaType, kafkaConsumer } from '../../src/index.js';
import type { ConsumerRecords, MSKEvent } from '../../src/types/types.js';
import { loadEvent } from '../helpers/loadEvent.js';
import { com } from '../protos/complex.generated.js';
import { Product as ProductProto } from '../protos/product.generated.js';

describe('Kafka consumer', () => {
  const jsonTestEvent = loadEvent('default.json');
  const avroTestEvent = loadEvent('avro.json');
  const protobufTestEvent = loadEvent('protobuf.json');
  const protobufComplexConfluent = loadEvent('protobuf-complex.confluent.json');
  const protobufComplexGlue = loadEvent('protobuf-complex.glue.json');
  const context = {} as Context;

  it('deserializes json message', async () => {
    // Prepare
    const event = structuredClone(jsonTestEvent);
    const handler = kafkaConsumer(async (event) => event, {
      value: { type: 'json' },
      key: { type: 'json' },
    });

    // Act
    const result = (await handler(event, context)) as ConsumerRecords;

    // Assess
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        key: 'recordKey',
        value: { id: 12345, name: 'product5', price: 45 },
        originalKey: 'cmVjb3JkS2V5',
        originalValue:
          'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
        topic: 'mytopic',
        partition: 0,
        offset: 15,
        timestamp: 1545084650987,
        timestampType: 'CREATE_TIME',
        headers: [{ headerKey: 'headerValue' }],
        originalHeaders: [
          { headerKey: [104, 101, 97, 100, 101, 114, 86, 97, 108, 117, 101] },
        ],
      })
    );
  });

  it('deserializes avro message', async () => {
    // Prepare
    const event = structuredClone(avroTestEvent);
    const handler = kafkaConsumer(async (event) => event, {
      value: {
        type: 'avro',
        schema: `{
          "type": "record",
          "name": "Product",
          "fields": [
            { "name": "id", "type": "int" },
            { "name": "name", "type": "string" },
            { "name": "price", "type": "double" }
          ]
        }`,
      },
      key: { type: 'json' },
    });

    // Act
    const result = (await handler(event, context)) as ConsumerRecords;

    // Assess
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        key: 42,
        value: { id: 1001, name: 'Laptop', price: 999.99 },
        originalKey: 'NDI=',
        originalValue: '0g8MTGFwdG9wUrgehes/j0A=',
        topic: 'mytopic',
        partition: 0,
        offset: 15,
        timestamp: 1545084650987,
        timestampType: 'CREATE_TIME',
        headers: [{ headerKey: 'headerValue' }],
        originalHeaders: [
          { headerKey: [104, 101, 97, 100, 101, 114, 86, 97, 108, 117, 101] },
        ],
      })
    );
  });

  it('deserializes protobuf message', async () => {
    // Prepare
    const event = structuredClone(protobufTestEvent);
    const handler = kafkaConsumer(async (event) => event, {
      value: {
        type: 'protobuf',
        schema: ProductProto,
      },
      key: { type: 'json' },
    });

    // Act
    const result = (await handler(event, context)) as ConsumerRecords;

    // Assess
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        key: 42,
        value: { id: 1001, name: 'Laptop', price: 999.99 },
        originalKey: 'NDI=',
        originalValue: 'COkHEgZMYXB0b3AZUrgehes/j0A=',
        topic: 'mytopic',
        partition: 0,
        offset: 15,
        timestamp: 1545084650987,
        timestampType: 'CREATE_TIME',
        headers: [{ headerKey: 'headerValue' }],
        originalHeaders: [
          { headerKey: [104, 101, 97, 100, 101, 114, 86, 97, 108, 117, 101] },
        ],
      })
    );
  });

  it.each([
    {
      type: SchemaType.PROTOBUF,
      event: structuredClone(protobufTestEvent),
      error: KafkaConsumerMissingSchemaError,
    },
    {
      type: SchemaType.AVRO,
      event: structuredClone(avroTestEvent),
      error: KafkaConsumerMissingSchemaError,
    },
  ])(
    'throws when schemaStr not passed for $type event',
    async ({ type, error, event }) => {
      // Prepare
      const handler = kafkaConsumer(
        async (event) => {
          for (const record of event.records) {
            try {
              return record.value;
            } catch (error) {
              return error;
            }
          }
        },
        {
          // @ts-expect-error - testing missing schemaStr
          value: { type },
        }
      );

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toEqual(
        expect.objectContaining({
          message: expect.stringContaining(
            `Schema string is required for ${type} deserialization`
          ),
          name: error.name,
        })
      );
    }
  );

  it('throws if using an unsupported schema type', async () => {
    // Prepare
    const event = structuredClone(jsonTestEvent);
    const handler = kafkaConsumer(async (event) => event, {
      value: {
        // @ts-expect-error - testing unsupported type
        type: 'xml',
      },
    });

    // Act & Assess
    await expect(handler(event, context)).rejects.toEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          'Unsupported deserialization type: xml. Supported types are: json, avro, protobuf.'
        ),
        name: 'KafkaConsumerDeserializationError',
      })
    );
  });

  it('deserializes with no headers provided', async () => {
    // Prepare
    const event = structuredClone(jsonTestEvent);
    event.records['mytopic-0'][0].headers = null;
    const handler = kafkaConsumer(async (event) => event, {
      value: { type: 'json' },
    });

    // Act
    const result = (await handler(event, context)) as ConsumerRecords;

    // Assess
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        key: 'recordKey',
        value: { id: 12345, name: 'product5', price: 45 },
        originalKey: 'cmVjb3JkS2V5',
        originalValue:
          'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
        headers: null,
        originalHeaders: null,
      })
    );
  });

  it.each([
    {
      type: 'key',
      event: (() => {
        const event = structuredClone(jsonTestEvent);
        event.records['mytopic-0'][0].key =
          'eyJpZCI6NDIsIm5hbWUiOiJpbnZhbGlkUHJvZHVjdCIsInByaWNlIjotMTAwfQ==';
        return event;
      })(),
    },
    {
      type: 'value',
      event: (() => {
        const event = structuredClone(jsonTestEvent);
        event.records['mytopic-0'][0].value =
          'eyJpZCI6NDIsIm5hbWUiOiJpbnZhbGlkUHJvZHVjdCIsInByaWNlIjotMTAwfQ==';
        return event;
      })(),
    },
  ])(
    'throws when parser schema validation fails for $type',
    async ({ event }) => {
      // Prepare
      const handler = kafkaConsumer(
        async (event) => {
          for (const record of event.records) {
            try {
              const { value, key } = record;
              return [value, key];
            } catch (error) {
              return error;
            }
          }
        },
        {
          value: {
            type: SchemaType.JSON,
            parserSchema: z.object({
              id: z.number(),
              name: z.string(),
              price: z.number().positive({
                message: "Price can't be negative",
              }),
            }),
          },
          key: {
            type: SchemaType.JSON,
            parserSchema: z.string(),
          },
        }
      );

      // Act & Assess
      const result = await handler(event, context);

      expect(result).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('Schema validation failed'),
          name: 'KafkaConsumerParserError',
          cause: expect.arrayContaining([
            expect.objectContaining({
              code: expect.any(String),
              message: expect.any(String),
            }),
          ]),
        })
      );
    }
  );

  it('throws when non MSK event passed kafka consumer', async () => {
    // Prepare
    const event = {} as unknown as MSKEvent;
    const handler = kafkaConsumer(async (event) => event, {
      value: { type: 'json' },
    });

    // Act & Assess
    await expect(handler(event, context)).rejects.toThrow(
      'Event is not a valid MSKEvent. Expected an object with a "records" property.'
    );
  });

  it.each([
    {
      type: 'key parserSchema but no value parserSchema',
      config: {
        key: {
          type: SchemaType.JSON,
          parserSchema: z.string(),
        },
        value: { type: SchemaType.JSON },
      },
    },
    {
      type: 'value parserSchema but no key parserSchema',
      config: {
        key: { type: SchemaType.JSON },
        value: {
          type: SchemaType.JSON,
          parserSchema: z.object({
            id: z.number(),
            name: z.string(),
            price: z.number().positive({
              message: "Price can't be negative",
            }),
          }),
        },
      },
    },
  ])('deserializes with $type', async ({ config }) => {
    // Prepare
    const event = structuredClone(jsonTestEvent);
    event.records['mytopic-0'][0].key = 'cmVjb3JkS2V5';
    event.records['mytopic-0'][0].value =
      'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9';
    event.records['mytopic-0'][0].headers = null;
    const handler = kafkaConsumer(async (event) => event, config);

    // Act
    const result = (await handler(event, context)) as ConsumerRecords;

    // Assess
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        key: 'recordKey',
        value: { id: 12345, name: 'product5', price: 45 },
        originalKey: 'cmVjb3JkS2V5',
        originalValue:
          'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
        headers: null,
        originalHeaders: null,
      })
    );
  });

  it.each([
    {
      type: 'undefined',
      keyValue: undefined,
    },
    {
      type: 'empty string',
      keyValue: '',
    },
  ])('handles empty keys gracefully $type', async ({ keyValue }) => {
    // Prepare
    const event = structuredClone(jsonTestEvent);
    event.records['mytopic-0'][0].key = keyValue;
    const handler = kafkaConsumer(async (event) => event, {
      value: { type: 'json' },
      key: { type: 'json' },
    });

    // Act
    const result = (await handler(event, context)) as ConsumerRecords;

    // Assess
    expect(result.records[0].key).toBeUndefined();
  });

  it('handles null keys gracefully', async () => {
    // Prepare
    const event = structuredClone(jsonTestEvent);
    event.records['mytopic-0'][0].key = null;
    const handler = kafkaConsumer(async (event) => event, {
      value: { type: 'json' },
      key: { type: 'json' },
    });

    // Act
    const result = (await handler(event, context)) as ConsumerRecords;

    // Assess
    expect(result.records[0].key).toBeNull();
  });

  it('defaults to primitive types when no SchemaConfig is provided', async () => {
    // Prepare
    const event = structuredClone(jsonTestEvent);
    const handler = kafkaConsumer(async (event) => event);

    // Act
    const result = (await handler(event, context)) as ConsumerRecords<
      unknown,
      unknown
    >;

    // Assess
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        key: 'recordKey',
        value: JSON.stringify(
          { id: 12345, name: 'product5', price: 45 },
          null,
          2
        ),
        headers: [
          {
            headerKey: 'headerValue',
          },
        ],
      })
    );
  });

  it('handles protobuf messages with delimiters', async () => {
    // Prepare
    const event = structuredClone(protobufTestEvent);
    event.records['mytopic-0'][0].value = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    event.records['mytopic-0'][0].valueSchemaMetadata.schemaId = undefined;
    event.records['mytopic-0'][1].value = 'AAjpBxIGTGFwdG9wGVK4HoXrP49A';
    event.records['mytopic-0'][1].valueSchemaMetadata.schemaId =
      '1111111111111111';
    event.records['mytopic-0'][2].value = 'AgEACOkHEgZMYXB0b3AZUrgehes/j0A=';
    event.records['mytopic-0'][2].valueSchemaMetadata.schemaId = '1';

    const handler = kafkaConsumer(
      async (event) => {
        const results = [];
        for (const record of event.records) {
          try {
            const { value } = record;
            results.push(value);
          } catch (error) {
            results.push(error);
          }
        }
        return results;
      },
      {
        value: {
          type: SchemaType.PROTOBUF,
          schema: ProductProto,
        },
      }
    );

    // Act
    const result = (await handler(event, context)) as
      | (typeof ProductProto)[]
      | Error[];

    // Assess
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 1001, name: 'Laptop', price: 999.99 });
    expect(result[1]).toEqual({ id: 1001, name: 'Laptop', price: 999.99 });
    expect(result[2]).toEqual({ id: 1001, name: 'Laptop', price: 999.99 });
  });

  it('handles complex protobuf messages from Confluent Schema Registry', async () => {
    // Prepare
    const event = structuredClone(protobufComplexConfluent);
    const handler = kafkaConsumer(
      async (event) => {
        const results = [];
        for (const record of event.records) {
          try {
            const { value } = record;
            results.push(value);
          } catch (error) {
            results.push(error);
          }
        }
        return results;
      },
      {
        value: {
          type: SchemaType.PROTOBUF,
          schema: com.example.protobuf.UserProfile,
          parserSchema: z.object({
            address: z.object({
              city: z.string(),
              street: z.string(),
              zip: z.string(),
            }),
            age: z.number().int().min(1),
            isActive: z.boolean(),
            preferences: z.object({
              theme: z.string().optional(),
            }),
            signupDate: z.string(),
            tags: z.array(z.string()),
          }),
        },
      }
    );

    // Act
    const result = (await handler(event, context)) as
      | (typeof com.example.protobuf.UserProfile)[]
      | Error[];

    // Assess
    expect(result).toHaveLength(4);
    expect(result[0]).not.toBeInstanceOf(Error);
    expect(result[1]).not.toBeInstanceOf(Error);
    expect(result[2]).not.toBeInstanceOf(Error);
    expect(result[3]).not.toBeInstanceOf(Error);
  });

  it('handles complex protobuf messages from Glue Schema Registry', async () => {
    // Prepare
    const event = structuredClone(protobufComplexGlue);
    const handler = kafkaConsumer(
      async (event) => {
        const results = [];
        for (const record of event.records) {
          try {
            const { value } = record;
            results.push(value);
          } catch (error) {
            results.push(error);
          }
        }
        return results;
      },
      {
        value: {
          type: SchemaType.PROTOBUF,
          schema: com.example.protobuf.UserProfile,
          parserSchema: z.object({
            userId: z.string(),
            address: z.object({
              city: z.string(),
              street: z.string(),
              zip: z.string(),
            }),
            age: z.number().int().min(1),
            isActive: z.boolean(),
            preferences: z.object({
              theme: z.string().optional(),
            }),
            signupDate: z.string(),
            tags: z.array(z.string()),
          }),
        },
      }
    );

    // Act
    const result = (await handler(event, context)) as
      | (typeof com.example.protobuf.UserProfile)[]
      | Error[];

    // Assess
    expect(result).toHaveLength(1);
    expect(result[0]).not.toStrictEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          'Failed to deserialize Protobuf message'
        ),
      })
    );
  });
});
