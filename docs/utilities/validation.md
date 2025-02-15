---
title: Validation (JSON Schema)
descrition: Utility
---

<!-- markdownlint-disable MD043 --->

This utility provides [JSON Schema](https://json-schema.org) validation for events and responses, including JMESPath support to unwrap events before validation.

!!! warning
    This feature is currently under development. As such it's considered not stable and we might make significant breaking changes before going before its release. You are welcome to [provide feedback](https://github.com/aws-powertools/powertools-lambda-typescript/discussions/3519) and [contribute to its implementation](https://github.com/aws-powertools/powertools-lambda-typescript/milestone/18).

## Key features

- Validate incoming event and response payloads
- JMESPath support to unwrap events before validation
- Built-in envelope to unwrap popular AWS service events
- TypeScript support with type-safe validation

## Getting started

```bash
npm install @aws-lambda-powertools/validation
```

You can validate inbound and outbound payloads using the validator class method decorator or Middy.js middleware.

You can also use the standalone `validate` function, if you want more control over the validation process such as handling a validation error.

!!! tip "Using JSON Schemas for the first time?"
    Check this step-by-step guide on [how to create JSON Schemas](https://json-schema.org/learn/getting-started-step-by-step.html).

    We support JSON Schema draft-07 by default.

### Validator decorator

The `@validator` decorator is a class method decorator that you can use to validate both the incoming event and the response payload.

If the validation fails, we will throw a `SchemaValidationError`.

??? note "A note on class method decorators"
    The class method decorators in this project follow the experimental implementation enabled via the [`experimentalDecorators` compiler option](https://www.typescriptlang.org/tsconfig#experimentalDecorators) in TypeScript. We will add support for the newer Stage 3 decorators proposal in the next major release.

    All our decorators assume that the method they are decorating is an async method. This means that even when decorating a synchronous method, it will return a promise. If this is not the desired behavior, you can use one of the other patterns to validate your payloads.

=== "getting_started_decorator.ts"

    ```typescript
    import { validator } from '@aws-lambda-powertools/validation';
    import type { Context } from 'aws-lambda';
    import {
      inboundSchema,
      outboundSchema,
      type InboundSchema,
      type OutboundSchema
    } from './getting_started_schemas.js';

    class Lambda {
      @validator({
        inboundSchema,
        outboundSchema,
      })
      async handler(event: InboundSchema, context: Context): Promise<OutboundSchema> {
        return {
          statusCode: 200,
          body: `Hello from ${event.userId}`,
        }
      }
    }
    ```

=== "getting_started_schemas.ts"

    ```typescript
    const inboundSchema = {
      type: 'object',
      properties: {
        userId: {
          type: 'string'
        }
      },
      required: ['userId']
    } as const;

    type InboundSchema = {
      userId: string;
    };

    const outboundSchema = {
      type: 'object',
      properties: {
        body: {
          type: 'string'
        },
        statusCode: {
          type: 'number'
        }
      },
      required: ['body', 'statusCode']
    } as const;

    type OutboundSchema = {
      body: string;
      statusCode: number;
    };

    export {
      inboundSchema,
      outboundSchema,
      type InboundSchema,
      type OutboundSchema
    };
    ```

!!! note
    It's not mandatory to validate both the inbound and outbound payloads. You can either use one, the other, or both.

### Validator middleware

If you are using Middy.js, you can use the `validator` middleware to validate the incoming event and response payload.

??? note "A note on Middy.js"
    We officially support versions of Middy.js `v4.x` through `v6.x`

    Check their docs to learn more about [Middy and its middleware stack](https://middy.js.org/docs/intro/getting-started){target="_blank"} as well as [best practices when working with Powertools](https://middy.js.org/docs/integrations/lambda-powertools#best-practices){target="_blank"}.

Like the class method decorator, if the validation fails, we will throw a `SchemaValidationError`, and you don't need to use both the inbound and outbound schemas if you don't need to.

=== "getting_started_middy.ts"

    ```typescript
    import { validator } from '@aws-lambda-powertools/validation/middleware';
    import middy from '@middy/core';
    import {
      inboundSchema,
      outboundSchema,
      type InboundSchema,
      type OutboundSchema
    } from './getting_started_schemas.js';

    export const handler = middy()
      .use(validator({
        inboundSchema,
        outboundSchema,
      }))
      .handler(
        async (event: InboundSchema, context: Context): Promise<OutboundSchema> => {
          return {
            statusCode: 200,
            body: `Hello from ${event.userId}`,
          }
        });
    ```

=== "getting_started_schemas.ts"

    ```typescript
    const inboundSchema = {
      type: 'object',
      properties: {
        userId: {
          type: 'string'
        }
      },
      required: ['userId']
    } as const;

    type InboundSchema = {
      userId: string;
    };

    const outboundSchema = {
      type: 'object',
      properties: {
        body: {
          type: 'string'
        },
        statusCode: {
          type: 'number'
        }
      },
      required: ['body', 'statusCode']
    } as const;

    type OutboundSchema = {
      body: string;
      statusCode: number;
    };

    export {
      inboundSchema,
      outboundSchema,
      type InboundSchema,
      type OutboundSchema
    };
    ```

### Standalone validation

The `validate` function gives you more control over the validation process, and is typically used within the Lambda handler, or any other function that performs validation.

You can also gracefully handle schema validation errors by catching `SchemaValidationError` errors.

=== "getting_started_standalone.ts"

    ```typescript
    import { validate, SchemaValidationError } from '@aws-lambda-powertools/validation';
    import { Logger } from '@aws-lambda-powertools/logger';
    import {
      inboundSchema,
      type InboundSchema,
    } from './getting_started_schemas.js';

    const logger = new Logger();

    export const handler = async (event: InboundSchema, context: Context) => {
      try {
        await validate({
          event,
          schema: inboundSchema,
        })

        return { // since we are not validating the output, we can return anything
          message: 'ok'
        }
      } catch (error) {
        if (error instanceof SchemaValidationError) {
          logger.error('Schema validation failed', error)
          throw new Error('Invalid event payload')
        }

        throw error
      }
    }
    ```

=== "getting_started_schemas.ts"

    ```typescript
    const inboundSchema = {
      type: 'object',
      properties: {
        userId: {
          type: 'string'
        }
      },
      required: ['userId']
    } as const;

    type InboundSchema = {
      userId: string;
    };

    const outboundSchema = {
      type: 'object',
      properties: {
        body: {
          type: 'string'
        },
        statusCode: {
          type: 'number'
        }
      },
      required: ['body', 'statusCode']
    } as const;

    type OutboundSchema = {
      body: string;
      statusCode: number;
    };

    export {
      inboundSchema,
      outboundSchema,
      type InboundSchema,
      type OutboundSchema
    };
    ```

### Unwrapping events prior to validation

In some cases you might want to validate only a portion of the event payload - this is what the `envelope` option is for.

Envelopes are [JMESPath expressions](https://jmespath.org/tutorial.html) to extract the part of the JSON you want before applying the JSON Schema validation.

Here is a sample custom EventBridge event, where we only want to validate the `detail` part of the event:

=== "getting_started_envelope.ts"

    ```typescript
    import { validator } from '@aws-lambda-powertools/validation';
    import type { Context } from 'aws-lambda';
    import {
      inboundSchema,
      type InboundSchema,
      type OutboundSchema
    } from './getting_started_schemas.js';

    class Lambda {
      @validator({
        inboundSchema,
        envelope: 'detail',
      })
      async handler(event: InboundSchema, context: Context) {
        return {
          message: `processed ${event.userId}`,
          success: true,
        }
      }
    }

    export const handler = new Lambda().handler
    ```

=== "getting_started_schemas.ts"

    ```typescript
    const inboundSchema = {
      type: 'object',
      properties: {
        userId: {
          type: 'string'
        }
      },
      required: ['userId']
    } as const;

    type InboundSchema = {
      userId: string;
    };

    const outboundSchema = {
      type: 'object',
      properties: {
        body: {
          type: 'string'
        },
        statusCode: {
          type: 'number'
        }
      },
      required: ['body', 'statusCode']
    } as const;

    type OutboundSchema = {
      body: string;
      statusCode: number;
    };

    export {
      inboundSchema,
      outboundSchema,
      type InboundSchema,
      type OutboundSchema
    };
    ```

== "getting_started_envelope_event.json"

    ```json
    {
      "version": "0",
      "id": "12345678-1234-1234-1234-123456789012",
      "detail-type": "myDetailType",
      "source": "myEventSource",
      "account": "123456789012",
      "time": "2017-12-22T18:43:48Z",
      "region": "us-west-2",
      "resources": [],
      "detail": {
        "userId": "123"
      }
    }
    ```

This is quite powerful as it allows you to validate only the part of the event that you are interested in, and thanks to JMESPath, you can extract records from [arrays](https://jmespath.org/tutorial.html#list-and-slice-projections), combine [pipe](https://jmespath.org/tutorial.html#pipe-expressions) and filter expressions, and more.

When combined, these features allow you to extract and validate the exact part of the event you actually care about.

### Built-in envelopes

We provide built-in envelopes to easily extract payloads from popular AWS event sources.

Here is an example of how you can use the built-in envelope for SQS events:

=== "getting_started_envelope_builtin.ts"

    ```typescript
    import { validator } from '@aws-lambda-powertools/validation';
    import { SQS } from '@aws-lambda-powertools/validation/envelopes/sqs';
    import type { Context } from 'aws-lambda';
    import {
      inboundSchema,
      type InboundSchema,
    } from './getting_started_schemas.js';

    const logger = new Logger();

    export const handler = middy()
      .use(validator({
        inboundSchema,
        envelope: SQS,
      }))
      .handler(
        async (event: Array<InboundSchema>, context: Context) => {
          for (const record of event) {
            logger.info(`Processing message ${record.userId}`);
          }
        }
      )
    ```

=== "getting_started_schemas.ts"

    ```typescript
    const inboundSchema = {
      type: 'object',
      properties: {
        userId: {
          type: 'string'
        }
      },
      required: ['userId']
    } as const;

    type InboundSchema = {
      userId: string;
    };

    const outboundSchema = {
      type: 'object',
      properties: {
        body: {
          type: 'string'
        },
        statusCode: {
          type: 'number'
        }
      },
      required: ['body', 'statusCode']
    } as const;

    type OutboundSchema = {
      body: string;
      statusCode: number;
    };

    export {
      inboundSchema,
      outboundSchema,
      type InboundSchema,
      type OutboundSchema
    };
    ```

=== "getting_started_envelope_event.json"

    ```json
    {
      "Records": [
        {
          "messageId": "c80e8021-a70a-42c7-a470-796e1186f753",
          "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
          "body": "{\"userId\":\"123\"}",
          "attributes": {
            "ApproximateReceiveCount": "3",
            "SentTimestamp": "1529104986221",
            "SenderId": "AIDAIC6K7FJUZ7Q",
            "ApproximateFirstReceiveTimestamp": "1529104986230"
          },
          "messageAttributes": {},
          "md5OfBody": "098f6bcd4621d373cade4e832627b4f6",
          "eventSource": "aws:sqs",
          "eventSourceARN": "arn:aws:sqs:us-west-2:123456789012:my-queue",
          "awsRegion": "us-west-2"
        },
        {
          "messageId": "c80e8021-a70a-42c7-a470-796e1186f753",
          "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
          "body": "{\"userId\":\"456\"}",
          "attributes": {
            "ApproximateReceiveCount": "3",
            "SentTimestamp": "1529104986221",
            "SenderId": "AIDAIC6K7FJUZ7Q",
            "ApproximateFirstReceiveTimestamp": "1529104986230"
          },
          "messageAttributes": {},
          "md5OfBody": "098f6bcd4621d373cade4e832627b4f6",
          "eventSource": "aws:sqs",
          "eventSourceARN": "arn:aws:sqs:us-west-2:123456789012:my-queue",
          "awsRegion": "us-west-2"
        }
      ]
    }
    ```

For a complete list of built-in envelopes, check the [Built-in envelopes section here](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#built-in-envelopes).

## Advanced

### Validating custom formats

While JSON Schema DRAFT-07 has many new built-in formats such as date, time, and specifically a regex format which can be used in place of custom formats, you can also define your own custom formats. This is useful when you have a specific format that is not covered by the built-in formats or when you don't control the schema.

JSON Schemas with custom formats like `awsaccountid` will fail validation if the format is not defined. You can define custom formats using the `formats` option to any of the validation methods.

=== "schema_with_custom_format.json"

    ```json
    {
      "type": "object",
      "properties": {
        "accountId": {
          "type": "string",
          "format": "awsaccountid"
        },
        "creditCard": {
          "type": "string",
          "format": "creditcard"
        }
      },
      "required": ["accountId"]
    }
    ```

For each one of these custom formats, you need to tell us how to validate them. To do so, you can either pass a `RegExp` object or a function that receives the value and returns a boolean.

For example, to validate using the schema above, you can define a custom format for `awsaccountid` like this:

=== "advanced_custom_format.ts"

    ```typescript
    import { validate, SchemaValidationError } from '@aws-lambda-powertools/validation';
    import { Logger } from '@aws-lambda-powertools/logger';

    const logger = new Logger();

    const customFormats = {
      awsaccountid: new RegExp('^[0-9]{12}$'),
      creditcard: (value: string) => {
        // Luhn algorithm (for demonstration purposes only - do not use in production)
        const sum = value.split('').reverse().reduce((acc, digit, index) => {
          const num = parseInt(digit, 10);
          return acc + (index % 2 === 0 ? num : num < 5 ? num * 2 : num * 2 - 9);
        }, 0);

        return sum % 10 === 0;
      }
    };

    export const handler = async (event: any, context: Context) => {
      try {
        await validate({
          event,
          schema: schemaWithCustomFormat,
          formats: customFormats,
        })

        return { // since we are not validating the output, we can return anything
          message: 'ok'
        }
      } catch (error) {
        if (error instanceof SchemaValidationError) {
          logger.error('Schema validation failed', error)
          throw new Error('Invalid event payload')
        }

        throw error
      }
    }
    ```

### Built-in JMESpath functions

In some cases, your payloads might require some transformation before validation. For example, you might want to parse a JSON string or decode a base64 string before validating the payload.

For this, you can use our buil-in JMESPath functions within your expressions. We have a few built-in functions that you can use:

- [`powertools_json`](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#powertools_json-function): Parses a JSON string
- [`powertools_base64`](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#powertools_base64-function): Decodes a base64 string
- [`powertools_base64_gzip`](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#powertools_base64_gzip-function): Decodes a base64 string and unzips it

We use these functions for [built-in envelopes](#built-in-envelopes) to easily decode and unwrap events from sources like Kinesis, SQS, S3, and more.

### Validating with external references

JSON Schema allows schemas to reference other schemas using the `$ref` keyword. This is useful when you have a common schema that you want to reuse across multiple schemas.

You can use the `externalRefs` option to pass a list of schemas that you want to reference in your inbound and outbound schemas.

=== "advanced_custom_format.ts"

    ```typescript
    import { validate } from '@aws-lambda-powertools/validation';
    import {
      inboundSchema,
      outboundSchema,
      defsSchema,
      type InboundSchema,
    } from './schemas_with_external_ref.ts';

    class Lambda {
      @validator({
        inboundSchema,
        outboundSchema,
        externalRefs: [defsSchema],
      })
      async handler(event: InboundSchema, context: Context) {
        return {
          message: `processed ${event.userId}`,
          success: true,
        }
      }
    }
    ```

=== "schemas_with_external_ref.ts"

    ```ts
    const defsSchema = {
      $id: 'http://example.com/schemas/defs.json',
      definitions: {
        int: { type: 'integer' },
        str: { type: 'string' },
      },
    } as const;

    const inboundSchema = {
      $id: 'http://example.com/schemas/inbound.json',
      type: 'object',
      properties: {
        userId: { $ref: 'defs.json#/definitions/str' }
      },
      required: ['userId']
    } as const;

    type InboundSchema = {
      userId: string;
    };

    const outboundSchema = {
      $id: 'http://example.com/schemas/outbound.json',
      type: 'object',
      properties: {
        body: { $ref: 'defs.json#/definitions/str' },
        statusCode: { $ref: 'defs.json#/definitions/int' }
      },
      required: ['body', 'statusCode']
    } as const;

    type OutboundSchema = {
      body: string;
      statusCode: number;
    };

    export {
      defsSchema,
      inboundSchema,
      outboundSchema,
      type InboundSchema,
      type OutboundSchema
    };
    ```
