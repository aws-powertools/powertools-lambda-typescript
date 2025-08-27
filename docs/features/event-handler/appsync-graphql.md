---
title: AppSync GraphQL
description: Event Handler for AppSync GraphQL APIs
status: new
---

Event Handler for AWS AppSync GraphQL APIs simplifies routing and processing of events in AWS Lambda functions. It allows you to define resolvers for GraphQL types and fields, making it easier to handle GraphQL requests without the need for complex VTL or JavaScript templates.

```mermaid
--8<-- "examples/snippets/event-handler/appsync-graphql/diagrams/intro.mermaid"
```

## Key Features

- Route events based on GraphQL type and field keys
- Automatically parse API arguments to function parameters
- Handle GraphQL responses and errors in the expected format

## Terminology

**[Direct Lambda Resolver](https://docs.aws.amazon.com/appsync/latest/devguide/direct-lambda-reference.html){target="_blank"}**. A custom AppSync Resolver that bypasses Apache Velocity Template (VTL) and JavaScript templates, and automatically maps your function's response to a GraphQL field.

**[Batching resolvers](https://docs.aws.amazon.com/appsync/latest/devguide/tutorial-lambda-resolvers.html#advanced-use-case-batching){target="_blank"}**. A technique that allows you to batch multiple GraphQL requests into a single Lambda function invocation, reducing the number of calls and improving performance.

## Getting started

???+ tip "Tip: Designing GraphQL Schemas for the first time?"
    Visit [AWS AppSync schema documentation](https://docs.aws.amazon.com/appsync/latest/devguide/designing-your-schema.html){target="_blank"} to understand how to define types, nesting, and pagination.

### Required resources

You must have an existing AppSync GraphQL API and IAM permissions to invoke your Lambda function. That said, there is no additional permissions to use Event Handler as routing requires no dependency (_standard library_).

This is the sample infrastructure we will be using for the initial examples with an AppSync Direct Lambda Resolver.

=== "gettingStartedSchema.graphql"

    ```typescript
    --8<-- "examples/snippets/event-handler/appsync-graphql/templates/gettingStartedSchema.graphql"
    ```

=== "template.yaml"

    ```yaml hl_lines="59-60 71-72 94-95 104-105 112-113"
    --8<-- "examples/snippets/event-handler/appsync-graphql/templates/gettingStartedSam.yaml"
    ```

### Registering a resolver

You can register functions to match GraphQL types and fields with one of three methods:

- `onQuery()` - Register a function to handle a GraphQL Query type.
- `onMutation()` - Register a function to handle a GraphQL Mutation type.
- `resolver()` - Register a function to handle a GraphQL type and field.

!!! question "What is a type and field?"
    A type would be a top-level **GraphQL Type** like `Query`, `Mutation`, `Todo`. A **GraphQL Field** would be `listTodos` under `Query`, `createTodo` under `Mutation`, etc.

The function receives the parsed arguments from the GraphQL request as its first parameter. We also take care of parsing the response or catching errors and returning them in the expected format.

#### Query resolver

When registering a resolver for a `Query` type, you can use the `onQuery()` method. This method allows you to define a function that will be invoked when a GraphQL Query is made.

```typescript hl_lines="2 8 10 21" title="Registering a resolver for a Query type"
--8<-- "examples/snippets/event-handler/appsync-graphql/gettingStartedOnQuery.ts"
```

#### Mutation resolver

Similarly, you can register a resolver for a `Mutation` type using the `onMutation()` method. This method allows you to define a function that will be invoked when a GraphQL Mutation is made.

```typescript hl_lines="2-5 11 13 25" title="Registering a resolver for a Mutation type"
--8<-- "examples/snippets/event-handler/appsync-graphql/gettingStartedOnMutation.ts"
```

#### Generic resolver

When you want to have more control over the type and field, you can use the `resolver()` method. This method allows you to register a function for a specific GraphQL type and field including custom types.

```typescript hl_lines="2 8 10 27-30" title="Registering a resolver for a type and field"
--8<-- "examples/snippets/event-handler/appsync-graphql/gettingStartedResolver.ts"
```

#### Using decorators

If you prefer to use the decorator syntax, you can instead use the same methods on a class method to register your handlers. Learn more about how Powertools for TypeScript supports [decorators](../../getting-started/usage-patterns.md).

```typescript hl_lines="3-6 12 15 27 38 60" title="Using decorators to register a resolver"
--8<-- "examples/snippets/event-handler/appsync-graphql/gettingStartedDecorators.ts"
```

1. It's recommended to pass a refernce of `this` to ensure the correct class scope is propageted to the route handler functions.

### Scalar functions

When working with [AWS AppSync Scalar types](https://docs.aws.amazon.com/appsync/latest/devguide/scalars.html){target="_blank"}, you might want to generate the same values for data validation purposes.

For convenience, the most commonly used values are available as helper functions within the module.

```typescript hl_lines="2-6" title="Creating key scalar values"
--8<-- "examples/snippets/event-handler/appsync-graphql/gettingStartedScalarFunctions.ts"
```

Here's a table with their related scalar as a quick reference:

| Scalar type      | Scalar function | Sample value                           |
| ---------------- | --------------- | -------------------------------------- |
| **ID**           | `makeId`        | `e916c84d-48b6-484c-bef3-cee3e4d86ebf` |
| **AWSDate**      | `awsDate`       | `2022-07-08Z`                          |
| **AWSTime**      | `awsTime`       | `15:11:00.189Z`                        |
| **AWSDateTime**  | `awsDateTime`   | `2022-07-08T15:11:00.189Z`             |
| **AWSTimestamp** | `awsTimestamp`  | `1657293060`                           |

## Advanced

### Nested mappings

!!! note

    The following examples use a more advanced schema. These schemas differ from the [initial sample infrastructure we used earlier](#required-resources).

You can register the same route handler multiple times to resolve fields with the same return value.

=== "Nested Mappings Example"

    ```typescript hl_lines="8 33-39"
    --8<-- "examples/snippets/event-handler/appsync-graphql/advancedNestedMappings.ts"
    ```

    1. If omitted, the `typeName` defaults to `Query`.

=== "Nested Mappings Schema"

    ```graphql hl_lines="6 20"
    --8<-- "examples/snippets/event-handler/appsync-graphql/templates/advancedNestedMappingsSchema.graphql"
    ```

### Accessing Lambda context and event

You can access the original Lambda event or context for additional information. These are passed to the handler function as optional arguments.

=== "Access event and context"

    ```typescript hl_lines="10"
    --8<-- "examples/snippets/event-handler/appsync-graphql/advancedAccessEventAndContext.ts"
    ```

    1. The `event` parameter contains the original AppSync event and has type `AppSyncResolverEvent` from the `@types/aws-lambda`.

### Exception Handling

You can use the `exceptionHandler` method to handle any exception. This allows you to handle common errors outside your resolver and return a custom response.

The `exceptionHandler` method also supports passing an array of exceptions that you wish to handle with a single handler.

You can use an AppSync JavaScript resolver or a VTL response mapping template to detect these custom responses and forward them to the client gracefully.

=== "Exception Handling"

    ```typescript hl_lines="11-18 21-23"
    --8<-- "examples/snippets/event-handler/appsync-graphql/exceptionHandling.ts"
    ```

=== "APPSYNC JS Resolver"

    ```js hl_lines="11-13"
    --8<-- "examples/snippets/event-handler/appsync-graphql/exceptionHandlingResolver.js"
    ```

=== "VTL Response Mapping Template"

    ```velocity hl_lines="1-3"
    --8<-- "examples/snippets/event-handler/appsync-graphql/exceptionHandlingResponseMapping.vtl"
    ```

=== "Exception Handling response"

    ```json hl_lines="11 20"
    --8<-- "examples/snippets/event-handler/appsync-graphql/exceptionHandlingResponse.json"
    ```

### Logging

By default, the utility uses the global `console` logger and emits only warnings and errors.

You can change this behavior by passing a custom logger instance to the `AppSyncGraphQLResolver` or `Router` and setting the log level for it, or by enabling [Lambda Advanced Logging Controls](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs-advanced.html) and setting the log level to `DEBUG`.

When debug logging is enabled, the resolver will emit logs that show the underlying handler resolution process. This is useful for understanding how your handlers are being resolved and invoked and can help you troubleshoot issues with your event processing.

For example, when using the [Powertools for AWS Lambda logger](../logger.md), you can set the `LOG_LEVEL` to `DEBUG` in your environment variables or at the logger level and pass the logger instance to the constructor to enable debug logging.

=== "Debug logging"

    ```typescript hl_lines="11"
    --8<-- "examples/snippets/event-handler/appsync-graphql/advancedDebugLogging.ts"
    ```

=== "Logs output"

    ```json
    --8<-- "examples/snippets/event-handler/appsync-graphql/samples/debugLogExcerpt.json"
    ```

## Testing your code

You can test your resolvers by passing an event with the shape expected by the AppSync GraphQL API resolver.

Here's an example of how you can test your resolvers that uses a factory function to create the event shape:

```typescript
--8<-- "examples/snippets/event-handler/appsync-graphql/advancedTestYourCode.ts"
```
