---
title: Usage patterns
description: Getting to know the Powertools for AWS Lambda toolkit
---

<!-- markdownlint-disable MD043 -->

Powertools for AWS Lambda (TypeScript) is a collection of utilities designed to help you build serverless applications on AWS.

The toolkit is modular, so you can pick and choose the utilities you need for your application, but also combine them for a complete solution for your serverless applications.  

## Patterns

Many of the utilities provided can be used with different patterns, depending on your preferences and the structure of your code.

### Class Method Decorator

If you prefer writing your business logic using Object-Oriented Programming (OOP) and TypeScript Classes, the Class Method decorator pattern is a good fit. This approach lets you decorate class methods with Powertools utilities, applying their functionality with minimal code changes.

This pattern works well when you want to integrate Powertools for AWS into an existing codebase without significant refactoring and with no additional runtime dependencies.

!!! note
    This approach relies on TypeScript's experimental decorator feature, see [TypeScript Settings](./typescript-settings.md) for more information.

```ts
---8<-- "examples/snippets/getting-started/patterns-decorator.ts"
```

All our decorators assume that the method they are decorating is asynchronous. This means that even when decorating a synchronous method, they will return a promise. If this is not the desired behavior, you can use one of the other patterns.

### Middy.js Middleware

If your existing codebase relies on the [Middy.js](https://middy.js.org/docs/) middleware engine, you can use the Powertools for AWS Lambda (TypeScript) middleware to integrate with your existing code. This approach is similar to the Class Method decorator pattern but uses the Middy.js middleware engine to apply Powertools utilities.

!!! note
    We guarantee support for Middy.js `v4.x` through `v6.x` versions.
    Check Middy.js docs to learn more about [best practices](https://middy.js.org/docs/integrations/lambda-powertools#best-practices){target="_blank"} when working with Powertools for AWS middlewares.

```ts
---8<-- "examples/snippets/getting-started/patterns-middyjs.ts"
```

### Functional Approach

If you prefer a more functional programming style, you can use the Powertools for AWS Lambda (TypeScript) utilities directly in your code without decorators or middleware. This approach is more verbose but provides the most control over how the utilities are applied.

```ts
---8<-- "examples/snippets/getting-started/patterns-functional.ts"
```
