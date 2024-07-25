---
title: Conventions
description: General conventions and practices that are applicable throughout to Powertools for AWS Lambda (TypeScript)
---

<!-- markdownlint-disable MD043 -->

## General terminology and practices

These are common conventions we keep on building as the project gains new contributors and grows in complexity.

As we gather more concrete examples, this page will have one section for each category to demonstrate a before and after.

| Category              | Convention                                                                                                                                                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Docstring**         | We use [TypeDoc](https://typedoc.org){target="_blank"} annotations to help generate more readable API references. For public APIs, we always include at least one **Example** to ease everyone's experience when using an IDE.                                                               |
| **Style guide**       | We use [Biome](http://biomejs.dev){target="_blank"} for linting and formatting to enforce beyond good practices. We use TypeScript types, function return types, and access modifiers to convey intent.                                                           |
| **Core utilities**    | Core utilities always accept `serviceName` as a constructor parameter, can work in isolation, and are also available in other languages implementation.                                                                                                                                      |
| **Utilities**         | Utilities are not as strict as core and focus on community needs: development productivity, industry leading practices, etc. Both core and general utilities follow our [Tenets](https://docs.powertools.aws.dev/lambda/typescript/#tenets){target="_blank"}.                                |
| **Errors**            | Specific errors thrown by Powertools live within utilities themselves and use `Error` suffix e.g. `IdempotencyKeyError`.                                                                                                                                                                     |
| **Git commits**       | We follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/){target="_blank"}. We do not enforce conventional commits on contributors to lower the entry bar. Instead, we enforce a conventional PR title so our label automation and changelog are generated correctly. |
| **API documentation** | API reference docs are generated from docstrings which should have Examples section to allow developers to have what they need within their own IDE. Documentation website covers the wider usage, tips, and strive to be concise.                                                           |
| **Documentation**     | We treat it like a product. We sub-divide content aimed at getting started (80% of customers) vs advanced usage (20%). We also ensure customers know how to unit test their code when using our features.                                                                                    |

## Repository structure

The repository uses a monorepo structure managed using [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces). This allows us to keep all code in one place and share common dependencies.

The Powertools for AWS Lambda (TypeScript) repository utilities live under the `packages/` directory. Each utility is a separate package and has its own `package.json` file. For example, the `@aws-lambda-powertools/logger` source code can be found under the `packages/logger/src` directory.

Whenever possible, we use the same directory structure for all utilities. This makes it easier for contributors to navigate the repository and find what they need.

Additionally, we try to share common runtime code between utilities to reduce maintenance overhead and runtime footprint. The shared runtime code lives under the `packages/commons/src` directory and is published to npm as the `@aws-lambda-powertools/commons` package.

There are also a few other workspaces that are not utilities published to npm, but that still share dependencies and/or runtime code with the utilities. These workspaces are:

* `examples/snippets`: contains the documentation code snippets
* `examples/app`: contains an example project that can be deployed via AWS CDK or AWS SAM
* `layers`: contains the code used to build and publish the [Lambda layers](../index.md#lambda-layer)

## Testing definition

We group tests in different categories

| Test              | When to write                                                                                                     | Notes                                                                                                                                      | Speed                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Unit tests        | Verify the smallest possible unit works.                                                                          | Networking access is prohibited. Keep mocks and spies at minimum.                                                                          | Fast (ms to few seconds at worst)                 |
| End-to-end tests  | Gain confidence that a Lambda function with our code operates as expected. Also referred to as integration tests. | It simulates how customers configure, deploy, and run their Lambda function - Event Source configuration, IAM permissions, etc.            | Slow (minutes)                                    |
| Performance tests | Ensure critical operations won't increase latency and costs to customers.                                         | CI arbitrary hardware can make it flaky. We'll resume writing perf test after we revamp our unit/functional tests with internal utilities. | Fast to moderate (a few seconds to a few minutes) |
