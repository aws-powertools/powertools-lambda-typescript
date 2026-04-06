# Powertools for AWS Lambda (TypeScript) <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.aws.amazon.com/powertools/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

## Intro

The Commons package contains a set of utilities that are shared across one or more Powertools for AWS Lambda (TypeScript) utilities. Some of these utilities can also be used independently in your AWS Lambda functions.

## Usage

To get started, install the utility by running:

```sh
npm i @aws-lambda-powertools/commons
```

### Type utils

When working with different objects and values, you may want to do runtime type checks. The utility comes with a set of type utilities that you can use to check the type of an object or value.

```typescript
import { isRecord } from '@aws-lambda-powertools/commons/typeUtils';
import { isString } from '@aws-lambda-powertools/commons/typeUtils';
import { isTruthy } from '@aws-lambda-powertools/commons/typeUtils';


const value = { key: 'value' };
if (isRecord(value)) {
  // value is a record
}

const stringValue = 'string';
if (isString(stringValue)) {
  // stringValue is a string
}

const truthyValue = 'true';
if (isTruthy(truthyValue)) {
  // truthyValue is truthy
}
```

You can find a full list of type utilities available [in the API docs](https://docs.aws.amazon.com/powertools/typescript/latest/api/modules/_aws-lambda-powertools_commons.typeUtils.html). Many of these utilities also double as type guards, which you can use to narrow down the type of an object or value.

### Base64 utils

When working with Base64-encoded data, you can use the `fromBase64` utilities to quickly decode data and convert it to a `Uint8Array`.

```typescript

import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';

const encodedValue = 'aGVsbG8gd29ybGQ=';

const decoded = fromBase64(encodedValue);
// new Uint8Array([ 97, 71, 86, 115, 98, 71, 56, 103, 100, 50, 57, 121, 98, 71, 81, 61 ]); 
```

### JSON type utils

In some cases, you may want to define a type for a JSON object or value. The utility comes with a set of types that you can use to define your JSON objects.

```typescript
import type { JSONValue, JSONObject, JSONArray } from '@aws-lambda-powertools/commons';
```

### Lambda interface

When using object-oriented patterns to define your Lambda handlers, you can use the `LambdaHandler` interface to define the shape of your handler methods.

```typescript
import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';

class Lambda implements LambdaInterface {
  public handler = async (event: unknown, context: Context) => {
    // Your handler code here
  }
}

const handlerClass = new Lambda();
export const handler = lambda.handler.bind(lambda);
```

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues), or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub repository.

## Connect

- **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
- **Email**: <aws-lambda-powertools-feedback@amazon.com>
