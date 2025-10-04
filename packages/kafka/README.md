# Powertools for AWS Lambda (TypeScript) - Kafka Utility <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.aws.amazon.com/powertools/typescript/latest/#features).

You can use the package in both TypeScript and JavaScript code bases.

## Intro

The Kafka Consumer utility transparently handles message deserialization, provides an intuitive developer experience, and integrates seamlessly with the rest of the Powertools for AWS Lambda ecosystem.

## Usage

To get started, depending on the schema types you want to use, install the library and the corresponding libraries:

For JSON schemas:

```bash
npm install @aws-lambda-powertools/kafka
```

For Avro schemas:

```bash
npm install @aws-lambda-powertools/kafka avro-js
```

For Protobuf schemas:

```bash
npm install @aws-lambda-powertools/kafka protobufjs
```

Additionally, if you want to use output parsing with [Standard Schema](https://github.com/standard-schema/standard-schema), you can install [any of the supported libraries](https://standardschema.dev/#what-schema-libraries-implement-the-spec), for example: Zod, Valibot, or ArkType.

### Deserialization

The Kafka consumer utility transforms raw Kafka events into an intuitive format for processing. To handle messages effectively, you'll need to configure a schema that matches your data format.

#### JSON Schema

```ts
import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const schemaConfig = {
  value: {
    type: SchemaType.JSON,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer(async (event, _context) => {
  for (const { value } of event.records) {
    logger.info('received value', { value });
  }
}, schemaConfig);
```

#### Avro Schema

```ts
import { readFileSync } from 'node:fs';
import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const schemaConfig = {
  value: {
    type: SchemaType.AVRO,
    schema: readFileSync(new URL('./user.avsc', import.meta.url), 'utf8'),
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer(async (event, _context) => {
  for (const { value } of event.records) {
    logger.info('received value', { value });
  }
}, schemaConfig);
```

#### Protobuf Schema

```ts
import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { User } from './samples/user.es6.generated.js'; // protobuf generated class

const logger = new Logger({ serviceName: 'kafka-consumer' });

const schemaConfig = {
  value: {
    type: SchemaType.PROTOBUF,
    schema: User,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer(async (event, _context) => {
  for (const { value } of event.records) {
    logger.info('received value', { value });
  }
}, schemaConfig);
```

### Additional Parsing

You can parse deserialized data using your preferred parsing library. This can help you integrate Kafka data with your domain schemas and application architecture, providing type hints, runtime parsing and validation, and advanced data transformations.

#### Zod

```ts
import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { z } from 'zod/v4';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const OrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const OrderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  createdAt: z.iso.datetime(),
  totalAmount: z.number().positive(),
});

const schemaConfig = {
  value: {
    type: SchemaType.JSON,
    parserSchema: OrderSchema,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer<unknown, z.infer<typeof OrderSchema>>(
  async (event, _context) => {
    for (const record of event.records) {
      const {
        value: { id, items },
      } = record;
      logger.setCorrelationId(id);
      logger.debug(`order includes ${items.length} items`);
    }
  },
  schemaConfig
);
```

#### Valibot

```ts
import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import * as v from 'valibot';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const OrderItemSchema = v.object({
  productId: v.string(),
  quantity: v.pipe(v.number(), v.integer(), v.toMinValue(1)),
  price: v.pipe(v.number(), v.integer()),
});

const OrderSchema = v.object({
  id: v.string(),
  customerId: v.string(),
  items: v.pipe(
    v.array(OrderItemSchema),
    v.minLength(1, 'Order must have at least one item')
  ),
  createdAt: v.pipe(v.string(), v.isoDateTime()),
  totalAmount: v.pipe(v.number(), v.toMinValue(0)),
});

const schemaConfig = {
  value: {
    type: SchemaType.JSON,
    parserSchema: OrderSchema,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer<unknown, v.InferInput<typeof OrderSchema>>(
  async (event, _context) => {
    for (const record of event.records) {
      const {
        value: { id, items },
      } = record;
      logger.setCorrelationId(id);
      logger.debug(`order includes ${items.length} items`);
    }
  },
  schemaConfig
);
```

#### ArkType

```ts
import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { type } from 'arktype';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const OrderItemSchema = type({
  productId: 'string',
  quantity: 'number.integer >= 1',
  price: 'number.integer',
});

const OrderSchema = type({
  id: 'string',
  customerId: 'string',
  items: OrderItemSchema.array().moreThanLength(0),
  createdAt: 'string.date',
  totalAmount: 'number.integer >= 0',
});

const schemaConfig = {
  value: {
    type: SchemaType.JSON,
    parserSchema: OrderSchema,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer<unknown, typeof OrderSchema.infer>(
  async (event, _context) => {
    for (const record of event.records) {
      const {
        value: { id, items },
      } = record;
      logger.setCorrelationId(id);
      logger.debug(`order includes ${items.length} items`);
    }
  },
  schemaConfig
);
```

See the [documentation](https://docs.aws.amazon.com/powertools/typescript/latest/features/kafka) for more details on how to use the Kafka utility.

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues), or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub repository.

## Connect

* **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
* **Email**: <aws-lambda-powertools-feedback@amazon.com>

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://s12d.com/become-reference-pt-ts) issue.

The following companies, among others, use Powertools:

* [Alma Media](https://www.almamedia.fi)
* [AppYourself](https://appyourself.net)
* [Bailey Nelson](https://www.baileynelson.com.au)
* [Banxware](https://www.banxware.com)
* [Caylent](https://caylent.com/)
* [Certible](https://www.certible.com/)
* [Elva](https://elva-group.com)
* [Flyweight](https://flyweight.io/)
* [FraudFalcon](https://fraudfalcon.app)
* [globaldatanet](https://globaldatanet.com/)
* [Guild](https://guild.com)
* [Hashnode](https://hashnode.com/)
* [Instil](https://instil.co/)
* [LocalStack](https://localstack.cloud/)
* [Ours Privacy](https://oursprivacy.com/)
* [Perfect Post](https://www.perfectpost.fr)
* [Sennder](https://sennder.com/)
* [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
* [Trek10](https://www.trek10.com/)
* [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has [already shared](https://docs.aws.amazon.com/powertools/typescript/latest/we_made_this) about Powertools for AWS Lambda (TypeScript).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.aws.amazon.com/powertools/typescript/latest/getting-started/lambda-layers/), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
