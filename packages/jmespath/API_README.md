# Powertools for AWS Lambda (TypeScript) - JMESPath Utility <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.aws.amazon.com/powertools/typescript/latest/#features).

You can use the package in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Usage](#usage)
    - [Basic usage](#basic-usage)
    - [Extract data from envelopes](#extract-data-from-envelopes)
    - [JMESPath custom functions](#jmespath-custom-functions)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
    - [Becoming a reference customer](#becoming-a-reference-customer)
    - [Sharing your work](#sharing-your-work)
    - [Using Lambda Layer](#using-lambda-layer)
- [License](#license)

## Intro

The JMESPath utility is a high-level function to parse and extract data from JSON objects using JMESPath expressions.

## Usage

To get started, install the library by running:

```sh
npm i @aws-lambda-powertools/jmespath
```

### Basic usage

At its core, the library provides a utility function to extract data from a JSON object using a JMESPath expression.

```ts
import { search } from '@aws-lambda-powertools/jmespath';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

type MyEvent = {
  foo: {
    bar: string;
  };
}

export const handler = async (event: MyEvent): Promise<void> => {
  const result = search(event, 'foo.bar');
  logger.info(result); // "baz"
};
```

### Extract data from envelopes

In some cases, you may want to extract data from an envelope. The library provides a utility function to help you work with envelopes and extract data from them.

```ts
import { extractDataFromEnvelope } from '@aws-lambda-powertools/jmespath/envelopes';

type MyEvent = {
  body: string; // "{\"customerId\":\"dd4649e6-2484-4993-acb8-0f9123103394\"}"
  deeplyNested: Array<{ someData: number[] }>;
};

type MessageBody = {
  customerId: string;
};

export const handler = async (event: MyEvent): Promise<unknown> => {
  const payload = extractDataFromEnvelope<MessageBody>(
    event,
    'powertools_json(body)'
  );
  const { customerId } = payload; // now deserialized

  // also works for fetching and flattening deeply nested data
  const someData = extractDataFromEnvelope<number[]>(
    event,
    'deeplyNested[*].someData[]'
  );

  return {
    customerId,
    message: 'success',
    context: someData,
    statusCode: 200,
  };
};
```

The library provides [a set of built-in envelopes](https://docs.aws.amazon.com/powertools/typescript/latest/features/jmespath/#built-in-envelopes) to help you extract data from common event sources, such as S3, SQS, and SNS, and more.

```ts
import {
  extractDataFromEnvelope,
  SQS,
} from '@aws-lambda-powertools/jmespath/envelopes';
import { Logger } from '@aws-lambda-powertools/logger';
import type { SQSEvent } from 'aws-lambda';

const logger = new Logger();

type MessageBody = {
  customerId: string;
};

export const handler = async (event: SQSEvent): Promise<void> => {
  const records = extractDataFromEnvelope<Array<MessageBody>>(event, SQS);
  for (const record of records) {
    // records is now a list containing the deserialized body of each message
    const { customerId } = record;
    logger.appendKeys({ customerId });
  }
};
```

### JMESPath custom functions

In addition to all the [built-in JMESPath functions](https://jmespath.org/specification.html#built-in-functions), the library provides custom functions to help you work with complex data structures. For example, you can use the `powertools_json` function to parse a JSON string, or the `powertools_base64` function to decode a base64-encoded string:

```ts
import { extractDataFromEnvelope } from '@aws-lambda-powertools/jmespath/envelopes';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (event: { payload: string }): Promise<void> => {
  const data = extractDataFromEnvelope<string>(
    event,
    'powertools_json(powertools_base64(payload))'
  );

  logger.info('Decoded payload', { data });
};
```

Finally, you can also extend the library with your own custom functions. Below an example of how to create a custom function to decode a Brotli-compressed string.

```ts
import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';
import { extractDataFromEnvelope } from '@aws-lambda-powertools/jmespath/envelopes';
import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';
import { Logger } from '@aws-lambda-powertools/logger';
import { brotliDecompressSync } from 'node:zlib';

const logger = new Logger();

class CustomFunctions extends PowertoolsFunctions {
  @PowertoolsFunctions.signature({
    argumentsSpecs: [['string']],
    variadic: false,
  })
  public funcDecodeBrotliCompression(value: string): string {
    const encoded = fromBase64(value, 'base64');
    const uncompressed = brotliDecompressSync(encoded);

    return uncompressed.toString();
  }
}

export const handler = async (event: { payload: string }): Promise<void> => {
  const message = extractDataFromEnvelope<string>(
    event,
    'Records[*].decode_brotli_compression(notification) | [*].powertools_json(@).message',
    { customFunctions: new CustomFunctions() }
  );

  logger.info('Decoded message', { message });
};
```

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues), or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub repository.

## Connect

- **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
- **Email**: <aws-lambda-powertools-feedback@amazon.com>
