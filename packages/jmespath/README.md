# Powertools for AWS Lambda (TypeScript) - JMESPath Utility <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the package in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Usage](#usage)
  - [Basic usage](#basic-usage)
  - [Extract data from envelopes](#extract-data-from-envelopes)
  - [JMESPath custom functions](#jmespath-custom-functions)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
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

The library provides [a set of built-in envelopes](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#built-in-envelopes) to help you extract data from common event sources, such as S3, SQS, and SNS, and more.

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

* **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
* **Email**: aws-lambda-powertools-feedback@amazon.com

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=customer-reference&template=support_powertools.yml&title=%5BSupport+Lambda+Powertools%5D%3A+%3Cyour+organization+name%3E) issue.

The following companies, among others, use Powertools:

* [Hashnode](https://hashnode.com/)
* [Caylent](https://caylent.com/)
* [Trek10](https://www.trek10.com/)
* [Elva](https://elva-group.com)
* [globaldatanet](https://globaldatanet.com/)
* [Bailey Nelson](https://www.baileynelson.com.au)
* [Perfect Post](https://www.perfectpost.fr)
* [Sennder](https://sennder.com/)
* [Certible](https://www.certible.com/)
* [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
* [AppYourself](https://appyourself.net)
* [Alma Media](https://www.almamedia.fi)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/#lambda-layer), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.