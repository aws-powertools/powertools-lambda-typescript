# Powertools for AWS Lambda (TypeScript) - Parser Utility <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.aws.amazon.com/powertools/typescript/latest/#features).

You can use the package in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Key features](#key-features)
- [Usage](#usage)
    - [Middy.js Middleware](#middyjs-middleware)
    - [Decorator](#decorator)
    - [Manual parsing](#manual-parsing)
    - [Safe parsing](#safe-parsing)
    - [Built-in schemas and envelopes](#built-in-schemas-and-envelopes)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
    - [Becoming a reference customer](#becoming-a-reference-customer)
    - [Sharing your work](#sharing-your-work)
    - [Using Lambda Layer](#using-lambda-layer)
- [License](#license)

## Intro

This utility provides data validation and parsing for [Standard Schema](https://github.com/standard-schema/standard-schema), together with a collection of built-in [Zod](https://zod.dev) schemas and envelopes to parse and unwrap popular AWS event source payloads.

## Key features

- Accept a [Standard Schema](https://github.com/standard-schema/standard-schema) and parse incoming payloads
- Built-in Zod schemas and envelopes to unwrap and validate popular AWS event sources payloads
- Extend and customize built-in Zod schemas to fit your needs
- Safe parsing option to avoid throwing errors and allow custom error handling
- Available as Middy.js middleware and TypeScript class method decorator

## Usage

To get started, install the library by running:

```sh
npm install @aws-lambda-powertools/parser zod
```

You can parse inbound events using the `parser` decorator, Middy.js middleware, or [manually](#manual-parsing) using built-in envelopes and schemas.

When using the decorator or middleware, you can specify a schema to parse the event: this can be a [built-in Zod schema](https://docs.aws.amazon.com/powertools/typescript/latest/features/parser/#built-in-schemas) or a custom schema you defined. Custom schemas can be defined using Zod or any other [Standard Schema compatible library](https://standardschema.dev/#what-schema-libraries-implement-the-spec).

### Middy.js Middleware

Using Zod schemas:

```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import middy from '@middy/core';
import { z } from 'zod';

const logger = new Logger();

const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string(),
  items: z.array(
    z.object({
      id: z.number().positive(),
      quantity: z.number().positive(),
      description: z.string(),
    })
  ),
  optionalField: z.string().optional(),
});

export const handler = middy()
  .use(parser({ schema: orderSchema }))
  .handler(async (event): Promise<void> => {
    for (const item of event.items) {
      // item is parsed as OrderItem
      logger.info('Processing item', { item });
    }
  });
```

Using Valibot schemas:

```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import middy from '@middy/core';
import {
  array,
  number,
  object,
  optional,
  pipe,
  string,
  toMinValue,
} from 'valibot';

const logger = new Logger();

const orderSchema = object({
  id: pipe(number(), toMinValue(0)),
  description: string(),
  items: array(
    object({
      id: pipe(number(), toMinValue(0)),
      quantity: pipe(number(), toMinValue(1)),
      description: string(),
    })
  ),
  optionalField: optional(string()),
});

export const handler = middy()
  .use(parser({ schema: orderSchema }))
  .handler(async (event): Promise<void> => {
    for (const item of event.items) {
      // item is parsed as OrderItem
      logger.info('Processing item', { item });
    }
  });
```

### Decorator

```typescript
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

const logger = new Logger();

const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string(),
  items: z.array(
    z.object({
      id: z.number().positive(),
      quantity: z.number(),
      description: z.string(),
    })
  ),
  optionalField: z.string().optional(),
});

type Order = z.infer<typeof orderSchema>;

class Lambda implements LambdaInterface {
  @parser({ schema: orderSchema })
  public async handler(event: Order, _context: Context): Promise<void> {
    // event is now typed as Order
    for (const item of event.items) {
      logger.info('Processing item', { item });
    }
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);
```

### Manual parsing

If you don't want to add an additional middleware dependency, or you prefer the manual approach, you can parse the event directly by calling the `parse` method on schemas and envelopes:

```typescript
import type { Context } from 'aws-lambda';
import { z } from 'zod';
import { EventBridgeEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import { EventBridgeSchema } from '@aws-lambda-powertools/parser/schemas';
import type { EventBridgeEvent } from '@aws-lambda-powertools/parser/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string(),
  items: z.array(
    z.object({
      id: z.number().positive(),
      quantity: z.number(),
      description: z.string(),
    })
  ),
  optionalField: z.string().optional(),
});
type Order = z.infer<typeof orderSchema>;

export const handler = async (
  event: EventBridgeEvent,
  _context: Context
): Promise<void> => {
  const parsedEvent = EventBridgeSchema.parse(event);
  logger.info('Parsed event', parsedEvent);

  const orders: Order = EventBridgeEnvelope.parse(event, orderSchema);
  logger.info('Parsed orders', orders);
};
```

### Safe parsing

When parsing data, you can use the `safeParse` method to avoid throwing errors and handle them manually:

```typescript
import type { Context } from 'aws-lambda';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { z } from 'zod';
import middy from '@middy/core';
import type {
  ParsedResult,
  EventBridgeEvent,
} from '@aws-lambda-powertools/parser/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string(),
  items: z.array(
    z.object({
      id: z.number().positive(),
      quantity: z.number(),
      description: z.string(),
    })
  ),
  optionalField: z.string().optional(),
});

type Order = z.infer<typeof orderSchema>;

const lambdaHandler = async (
  event: ParsedResult<EventBridgeEvent, Order>,
  _context: Context
): Promise<void> => {
  if (event.success) {
    // (2)!
    for (const item of event.data.items) {
      logger.info('Processing item', { item });
    }
  } else {
    logger.error('Error parsing event', { event: event.error });
    logger.error('Original event', { event: event.originalEvent });
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: orderSchema, safeParse: true })
);
```

See the [safe parsing](https://docs.aws.amazon.com/powertools/typescript/latest/features/parser#safe-parsing) section in the documentation for more details.

### Built-in schemas and envelopes

The utility provides a set of built-in schemas and envelopes to parse popular AWS event sources payloads, for example:

```typescript
import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { parser } from '@aws-lambda-powertools/parser';
import { z } from 'zod';
import { EventBridgeEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string(),
  items: z.array(
    z.object({
      id: z.number().positive(),
      quantity: z.number(),
      description: z.string(),
    })
  ),
  optionalField: z.string().optional(),
});

type Order = z.infer<typeof orderSchema>;

class Lambda implements LambdaInterface {
  @parser({ schema: orderSchema, envelope: EventBridgeEnvelope })
  public async handler(event: Order, _context: Context): Promise<void> {
    // event is now typed as Order
    for (const item of event.items) {
      logger.info('Processing item', item); // (2)!
    }
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);
```

Check the utility documentation for a complete list of built-in [schemas](https://docs.aws.amazon.com/powertools/typescript/latest/features/parser/#built-in-schemas) and [envelopes](https://docs.aws.amazon.com/powertools/typescript/latest/features/parser/#built-in-envelopes).

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues), or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub repository.

## Connect

- **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
- **Email**: <aws-lambda-powertools-feedback@amazon.com>

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company
is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by
raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://s12d.com/become-reference-pt-ts)
issue.

The following companies, among others, use Powertools:

- [Alma Media](https://www.almamedia.fi)
- [AppYourself](https://appyourself.net)
- [Bailey Nelson](https://www.baileynelson.com.au)
- [Banxware](https://www.banxware.com)
- [Caylent](https://caylent.com/)
- [Certible](https://www.certible.com/)
- [Elva](https://elva-group.com)
- [Flyweight](https://flyweight.io/)
- [FraudFalcon](https://fraudfalcon.app)
- [globaldatanet](https://globaldatanet.com/)
- [Guild](https://guild.com)
- [Hashnode](https://hashnode.com/)
- [Instil](https://instil.co/)
- [LocalStack](https://localstack.cloud/)
- [Ours Privacy](https://oursprivacy.com/)
- [Perfect Post](https://www.perfectpost.fr)
- [Sennder](https://sennder.com/)
- [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
- [Trek10](https://www.trek10.com/)
- [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has [already shared](https://docs.aws.amazon.com/powertools/typescript/latest/we_made_this) about Powertools for AWS Lambda (TypeScript).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.aws.amazon.com/powertools/typescript/latest/getting-started/lambda-layers/), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.This library is licensed under the MIT-0 License. See the LICENSE file.
