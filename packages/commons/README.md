# Powertools for AWS Lambda (TypeScript) <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

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

Here's a full list of type utilities available in the package:

- [`isInteger`](https://docs.powertools.aws.dev/lambda/typescript/latest/api/functions/_aws_lambda_powertools_commons.isIntegerNumber.html)
- [`isNull`](https://docs.powertools.aws.dev/lambda/typescript/latest/api/functions/_aws_lambda_powertools_commons.isNull.html)
- [`isNullOrUndefined`](https://docs.powertools.aws.dev/lambda/typescript/latest/api/functions/_aws_lambda_powertools_commons.isNullOrUndefined.html)
- [`isNumber`](https://docs.powertools.aws.dev/lambda/typescript/latest/api/functions/_aws_lambda_powertools_commons.isNumber.html)
- [`isRecord`](https://docs.powertools.aws.dev/lambda/typescript/latest/api/functions/_aws_lambda_powertools_commons.isRecord.html)
- [`isStrictEqual`](https://docs.powertools.aws.dev/lambda/typescript/latest/api/functions/_aws_lambda_powertools_commons.isStrictEqual.html)
- [`isString`](https://docs.powertools.aws.dev/lambda/typescript/latest/api/functions/_aws_lambda_powertools_commons.isString.html)
- [`isTruthy`](https://docs.powertools.aws.dev/lambda/typescript/latest/api/functions/_aws_lambda_powertools_commons.isTruthy.html)

Many of these utilities also double as type guards, which you can use to narrow down the type of an object or value.

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

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=customer-reference&template=support_powertools.yml&title=%5BSupport+Lambda+Powertools%5D%3A+%3Cyour+organization+name%3E) issue.

The following companies, among others, use Powertools:

- [Alma Media](https://www.almamedia.fi)
- [AppYourself](https://appyourself.net)
- [Bailey Nelson](https://www.baileynelson.com.au)
- [Banxware](https://www.banxware.com)
- [Caylent](https://caylent.com/)
- [Certible](https://www.certible.com/)
- [Elva](https://elva-group.com)
- [globaldatanet](https://globaldatanet.com/)
- [Hashnode](https://hashnode.com/)
- [LocalStack](https://localstack.cloud/)
- [Perfect Post](https://www.perfectpost.fr)
- [Sennder](https://sennder.com/)
- [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
- [Trek10](https://www.trek10.com/)
- [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/#lambda-layer), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
