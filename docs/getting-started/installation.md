---
title: Installation
description: Installing Powertools for AWS Lambda
---

<!-- markdownlint-disable MD043 -->

You can use Powertools for AWS Lambda (TypeScript) by installing it with your favorite dependency management, or via [Lambda Layers](lambda-layers.md).

The toolkit is compatible with both TypeScript and JavaScript code bases, and supports both CommonJS and ES modules.

All features are available as individual packages, so you can install only the ones you need, for example:

* **Logger**: `npm i @aws-lambda-powertools/logger`{.copyMe}:clipboard:
* **Metrics**: `npm i @aws-lambda-powertools/metrics`{.copyMe}:clipboard:
* **Tracer**: `npm i @aws-lambda-powertools/tracer`{.copyMe}:clipboard:

See the [Features](../features/index.md) page for a complete list of available utilities.

### Extra dependencies

Some features use additional dependencies like the AWS SDK for JavaScript v3, which might you need to install separately. Below is a list of utilities that use external dependencies, and the packages you need to install to use them.

| Feature                                                              | Install                                                                                                           | Default dependency  |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------- |
| **[Tracer](./features/tracer.md)**                                   | **`npm i @aws-lambda-powertools/tracer`**{.copyMe}:clipboard:                                                     | `aws-xray-sdk-core` |
| **[Idempotency](./features/idempotency.md)**                         | **`npm i @aws-lambda-powertools/idempotency @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb`**{.copyMe}:clipboard: |                     |
| **[Parameters (SSM)](./features/parameters.md)**                     | **`npm i @aws-lambda-powertools/parameters @aws-sdk/client-ssm`**{.copyMe}:clipboard:                             |                     |
| **[Parameters (Secrets Manager)](./features/parameters.md)**         | **`npm i @aws-lambda-powertools/parameters @aws-sdk/client-secrets-manager`**{.copyMe}:clipboard:                 |                     |
| **[Parameters (AppConfig)](./features/parameters.md)**               | **`npm i @aws-lambda-powertools/parameters @aws-sdk/client-appconfigdata`**{.copyMe}:clipboard:                   |                     |
| **[Parser](./features/parser.md)**                                   | **`npm i @aws-lambda-powertools/parser zod@~3`**{.copyMe}:clipboard:                                              |                     |
| **[Validation](./features/validation.md)**                           | **`npm i @aws-lambda-powertools/validation`**{.copyMe}:clipboard:                                                 | `ajv`               |
