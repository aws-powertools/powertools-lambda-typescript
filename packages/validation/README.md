# Powertools for AWS Lambda (TypeScript) - Validation Utility

This utility provides JSON Schema validation for events and responses, including JMESPath support to unwrap events before validation.

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features). You can use the library in both TypeScript and JavaScript code bases.

To get started, install the package by running:

```sh
npm i @aws-lambda-powertools/validation
```

## Features

You can validate inbound and outbound payloads using the `@validator` class method decorator or `validator` Middy.js middleware.

You can also use the standalone `validate` function, if you want more control over the validation process such as handling a validation error.

### Validator decorator

The `@validator` decorator is a TypeScript class method decorator that you can use to validate both the incoming event and the response payload.

If the validation fails, we will throw a `SchemaValidationError`.

```typescript
import { validator } from '@aws-lambda-powertools/validation/decorator';
import type { Context } from 'aws-lambda';

const inboundSchema = {
  type: 'object',
  properties: {
    value: { type: 'number' },
  },
  required: ['value'],
  additionalProperties: false,
};

const outboundSchema = {
  type: 'object',
  properties: {
    result: { type: 'number' },
  },
  required: ['result'],
  additionalProperties: false,
};

class Lambda {
  @validator({
    inboundSchema,
    outboundSchema,
  })
  async handler(event: { value: number }, _context: Context) {
    // Your handler logic here
    return { result: event.value * 2 };
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
```

It's not mandatory to validate both the inbound and outbound payloads. You can either use one, the other, or both.

### Validator middleware

If you are using Middy.js, you can instead use the `validator` middleware to validate the incoming event and response payload.

```typescript
import { validator } from '@aws-lambda-powertools/validation/middleware';
import middy from '@middy/core';

const inboundSchema = {
  type: 'object',
  properties: {
    foo: { type: 'string' },
  },
  required: ['foo'],
  additionalProperties: false,
};

const outboundSchema = {
  type: 'object',
  properties: {
    bar: { type: 'number' },
  },
  required: ['bar'],
  additionalProperties: false,
};

export const handler = middy()
  .use(validation({ inboundSchema, outboundSchema }))
  .handler(async (event) => {
    // Your handler logic here
    return { bar: 42 };
  });
```

Like the `@validator` decorator, you can choose to validate only the inbound or outbound payload.

### Standalone validate function

The `validate` function gives you more control over the validation process, and is typically used within the Lambda handler, or any other function that needs to validate data.

When using the standalone function, you can gracefully handle schema validation errors by catching `SchemaValidationError` errors.

```typescript
import { validate } from '@aws-lambda-powertools/validation';
import { SchemaValidationError } from '@aws-lambda-powertools/validation/errors';

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
  required: ['name', 'age'],
  additionalProperties: false,
} as const;

const payload = { name: 'John', age: 30 };

export const handler = async (event: unknown) => {
  try {
    const validatedData = validate({
      payload,
      schema,
    });

    // Your handler logic here
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      // Handle the validation error
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.message }),
      };
    }
    // Handle other errors
    throw error;
  }
}
```

### JMESPath support

In some cases you might want to validate only a portion of the event payload - this is what the `envelope` option is for.

You can use JMESPath expressions to specify the path to the property you want to validate. The validator will unwrap the event before validating it.

```typescript
import { validate } from '@aws-lambda-powertools/validation';

const schema = {
  type: 'object',
  properties: {
    user: { type: 'string' },
  },
  required: ['user'],
  additionalProperties: false,
} as const;

const payload = {
  data: {
    user: 'Alice',
  },
};

const validatedData = validate({
  payload,
  schema,
  envelope: 'data',
});
```

### Extending the validator

Since the validator is built on top of [Ajv](https://ajv.js.org/), you can extend it with custom formats and external schemas, as well as bringing your own `ajv` instance.

The example below shows how to pass additional options to the `validate` function, but you can also pass them to the `@validator` decorator and `validator` middleware.

```typescript
import { validate } from '@aws-lambda-powertools/validation';

const formats = {
  ageRange: (value: number) => return value >= 0 && value <= 120,
};

const definitionSchema = {
  $id: 'https://example.com/schemas/definitions.json',
  definitions: {
    user: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number', format: 'ageRange' },
      },
      required: ['name', 'age'],
      additionalProperties: false,
    }
  }
} as const;

const schema = {
  $id: 'https://example.com/schemas/user.json',
  type: 'object',
  properties: {
    user: { $ref: 'definitions.json#/definitions/user' },
  },
  required: ['user'],
  additionalProperties: false,
} as const;

const payload = {
  user: {
    name: 'Alice',
    age: 25,
  },
};

const validatedData = validate({
  payload,
  schema,
  externalRefs: [definitionSchema],
  formats,
});
```

For more information on how to use the `validate` function, please refer to the [documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/validation).

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

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://s12d.com/become-reference-pt-ts) issue.

The following companies, among others, use Powertools:

- [Alma Media](https://www.almamedia.fi)
- [AppYourself](https://appyourself.net)
- [Bailey Nelson](https://www.baileynelson.com.au)
- [Banxware](https://www.banxware.com)
- [Caylent](https://caylent.com/)
- [Certible](https://www.certible.com/)
- [Elva](https://elva-group.com)
- [Flyweight](https://flyweight.io/)
- [globaldatanet](https://globaldatanet.com/)
- [Guild](https://guild.com)
- [Hashnode](https://hashnode.com/)
- [LocalStack](https://localstack.cloud/)
- [Ours Privacy](https://oursprivacy.com/)
- [Perfect Post](https://www.perfectpost.fr)
- [Sennder](https://sennder.com/)
- [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
- [Trek10](https://www.trek10.com/)
- [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has [already shared](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this) about Powertools for AWS Lambda (TypeScript).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/getting-started/lambda-layers/), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
