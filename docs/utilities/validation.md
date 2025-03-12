---
title: Validation
descrition: Utility
status: new
---

<!-- markdownlint-disable MD043 --->

This utility provides [JSON Schema](https://json-schema.org) validation for events and responses, including JMESPath support to unwrap events before validation.

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
    Check this step-by-step guide on [how to create JSON Schemas](https://json-schema.org/learn/getting-started-step-by-step.html). By default, we support JSON Schema draft-07.

### Validator decorator

The `@validator` decorator is a class method decorator that you can use to validate both the incoming event and the response payload.

If the validation fails, we will throw a `SchemaValidationError`.

??? note "A note on class method decorators"
    The class method decorators in this project follow the experimental implementation enabled via the [`experimentalDecorators` compiler option](https://www.typescriptlang.org/tsconfig#experimentalDecorators) in TypeScript. We will add support for the newer Stage 3 decorators proposal in the next major release.

    All our decorators assume that the method they are decorating is an async method. This means that even when decorating a synchronous method, it will return a promise. If this is not the desired behavior, you can use one of the other patterns to validate your payloads.

=== "gettingStartedDecorator.ts"

    ```typescript hl_lines="1 11-14"
    --8<-- "examples/snippets/validation/gettingStartedDecorator.ts"
    ```

=== "schemas.ts"

    ```typescript
    --8<-- "examples/snippets/validation/schemas.ts"
    ```

It's not mandatory to validate both the inbound and outbound payloads. You can either use one, the other, or both.

### Validator middleware

If you are using Middy.js, you can use the `validator` middleware to validate the incoming event and response payload.

??? note "A note on Middy.js"
    We officially support versions of Middy.js `v4.x` through `v6.x`

    Check their docs to learn more about [Middy.js and its middleware stack](https://middy.js.org/docs/intro/getting-started){target="_blank"} as well as [best practices when working with Powertools for AWS](https://middy.js.org/docs/integrations/lambda-powertools#best-practices){target="_blank"}.

Like the class method decorator, if the validation fails, we will throw a `SchemaValidationError`, and you don't need to use both the inbound and outbound schemas if you don't need to.

=== "gettingStartedMiddy.ts"

    ```typescript hl_lines="1 12-15"
    --8<-- "examples/snippets/validation/gettingStartedMiddy.ts"
    ```

=== "schemas.ts"

    ```typescript
    --8<-- "examples/snippets/validation/schemas.ts"
    ```

### Standalone validation

The `validate` function gives you more control over the validation process, and is typically used within the Lambda handler, or any other function that performs validation.

You can also gracefully handle schema validation errors by catching `SchemaValidationError` errors.

=== "gettingStartedStandalone.ts"

    ```typescript hl_lines="2 3 10-13 19"
    --8<-- "examples/snippets/validation/gettingStartedStandalone.ts"
    ```

    1. Since we are not validating the output, we can return anything

=== "schemas.ts"

    ```typescript
    --8<-- "examples/snippets/validation/schemas.ts"
    ```

### Unwrapping events prior to validation

In some cases you might want to validate only a portion of the event payload - this is what the `envelope` option is for.

Envelopes are [JMESPath expressions](https://jmespath.org/tutorial.html) to extract the part of the JSON you want before applying the JSON Schema validation.

Here is a sample custom EventBridge event, where we only want to validate the `detail` part of the event:

=== "gettingStartedEnvelope.ts"

    ```typescript hl_lines="8"
    --8<-- "examples/snippets/validation/gettingStartedEnvelope.ts"
    ```

=== "schemas.ts"

    ```typescript
    --8<-- "examples/snippets/validation/schemas.ts"
    ```

=== "gettingStartedEnvelopeEvent.json"

    ```json
    --8<-- "examples/snippets/validation/samples/gettingStartedEnvelopeEvent.json"
    ```

This is quite powerful as it allows you to validate only the part of the event that you are interested in, and thanks to JMESPath, you can extract records from [arrays](https://jmespath.org/tutorial.html#list-and-slice-projections), combine [pipe](https://jmespath.org/tutorial.html#pipe-expressions) and filter expressions, and more.

When combined, these features allow you to extract and validate the exact part of the event you actually care about.

### Built-in envelopes

We provide built-in envelopes to easily extract payloads from popular AWS event sources.

Here is an example of how you can use the built-in envelope for SQS events:

=== "gettingStartedEnvelopeBuiltin.ts"

    ```typescript hl_lines="1 13"
    --8<-- "examples/snippets/validation/gettingStartedEnvelopeBuiltin.ts"
    ```

=== "schemas.ts"

    ```typescript
    --8<-- "examples/snippets/validation/schemas.ts"
    ```

=== "gettingStartedSQSEnvelopeEvent.json"

    ```json
    --8<-- "examples/snippets/validation/samples/gettingStartedSQSEnvelopeEvent.json"
    ```

For a complete list of built-in envelopes, check the built-in envelopes section [here](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#built-in-envelopes).

## Advanced

### Validating custom formats

While JSON Schema draft-07 has many new built-in formats such as date, time, and specifically a regex format which can be used in place of custom formats, you can also define your own custom formats.

This is useful when you have a specific format that is not covered by the built-in formats or when you don't control the schema.

JSON Schemas with custom formats like `awsaccountid` will fail validation if the format is not defined. You can define custom formats using the `formats` option to any of the validation methods.

=== "schemaWithCustomFormat.json"

    ```json
    --8<-- "examples/snippets/validation/samples/schemaWithCustomFormat.json"
    ```

For each one of these custom formats, you need to tell us how to validate them. To do so, you can either pass a `RegExp` object or a function that receives the value and returns a boolean.

For example, to validate using the schema above, you can define a custom format for `awsaccountid` like this:

=== "advancedCustomFormats.ts"

    ```typescript hl_lines="29"
    --8<-- "examples/snippets/validation/advancedCustomFormats.ts"
    ```

### Built-in JMESpath functions

In some cases, your payloads might require some transformation before validation. For example, you might want to parse a JSON string or decode a base64 string before validating the payload.

For this, you can use our buil-in JMESPath functions within your expressions. We have a few built-in functions that you can use:

- [`powertools_json()`](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#powertools_json-function): Parses a JSON string
- [`powertools_base64()`](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#powertools_base64-function): Decodes a base64 string
- [`powertools_base64_gzip()`](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#powertools_base64_gzip-function): Decodes a base64 string and unzips it

We use these functions for [built-in envelopes](#built-in-envelopes) to easily decode and unwrap events from sources like Kinesis, SQS, S3, and more.

### Validating with external references

JSON Schema allows schemas to reference other schemas using the `$ref` keyword. This is useful when you have a common schema that you want to reuse across multiple schemas.

You can use the `externalRefs` option to pass a list of schemas that you want to reference in your inbound and outbound schemas.

=== "advancedExternalRefs.ts"

    ```typescript hl_lines="14"
    --8<-- "examples/snippets/validation/advancedExternalRefs.ts"
    ```

=== "schemasWithExternalRefs.ts"

    ```typescript
    --8<-- "examples/snippets/validation/schemasWithExternalRefs.ts"
    ```

### Bringing your own `ajv` instance

By default, we use JSON Schema draft-07. If you want to use a different draft, you can pass your own `ajv` instance to any of the validation methods.

This is also useful if you want to configure `ajv` with custom options like keywords and more.

=== "advancedBringAjvInstance.ts"

    ```typescript hl_lines="9 16"
    --8<-- "examples/snippets/validation/advancedBringAjvInstance.ts"
    ```

## Should I use this or Parser?

One of Powertools for AWS Lambda [tenets](../index.md#tenets) is to be progressive. This means that our utilities are designed to be incrementally adopted by customers at any stage of their serverless journey.

For new projects, especially those using TypeScript, we recommend using the [Parser](parser.md) utility. Thanks to its integration with [Zod](http://zod.dev), it provides an expressive and type-safe way to validate and parse payloads.

If instead you are already using JSON Schema, or simply feel more comfortable with it, the Validation utility is a great choice. It provides an opinionated thin layer on top of the popular [ajv](https://ajv.js.org) library, with built-in support for JMESPath and AWS service envelopes.

When it comes to feature set, besides the type-safe parsing, the Parser utility also provides a rich collection of built-in schemas and envelopes for AWS services. The Validation utility, on the other hand, follows a more bring-your-own-schema approach, with built-in support for JMESPath and AWS service envelopes to help you unwrap events before validation.

Additionally, while both utilities serve specific use cases, understanding your project requirements will help you choose the right tool for your validation needs.

Finally, in terms of bundle size, the Validation utility is slightly heavier than the Parser utility primarily due to ajv not providing ESM builds. However, even with this, the Validation utility still clocks in at under ~100KB when minified and bundled.
