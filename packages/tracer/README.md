# Powertools for AWS Lambda (TypeScript) <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Usage](#usage)
    - [Basic usage](#basic-usage)
    - [Capture AWS SDK clients](#capture-aws-sdk-clients)
    - [Add metadata and annotations](#add-metadata-and-annotations)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
    - [Becoming a reference customer](#becoming-a-reference-customer)
    - [Sharing your work](#sharing-your-work)
    - [Using Lambda Layer](#using-lambda-layer)
- [License](#license)

## Intro

The Tracer utility is an opinionated thin wrapper for [AWS X-Ray SDK for Node.js](https://github.com/aws/aws-xray-sdk-node), to automatically capture cold starts, trace HTTP(S) clients including `fetch` and generate segments and add metadata or annotations to traces.

## Usage

To get started, install the library by running:

```sh
npm i @aws-lambda-powertools/tracer
```

### Basic usage

Add `Tracer` to your Lambda handler as decorator:

```ts
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

class Lambda implements LambdaInterface {
  // Decorate your handler class method
  @tracer.captureLambdaHandler()
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    tracer.getSegment();
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); 
```

or using middy:

```ts
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  tracer.putAnnotation('successfulBooking', true);
};

// Wrap the handler with middy
export const handler = middy(lambdaHandler)
  // Use the middleware by passing the Tracer instance as a parameter
  .use(captureLambdaHandler(tracer));
```

### Capture AWS SDK clients

To capture AWS SDK clients, you can use the `captureAWSv3Client` method:

```ts
import { Tracer } from '@aws-lambda-powertools/tracer';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
// Instrument the AWS SDK client
const client = tracer.captureAWSv3Client(new SecretsManagerClient({}));

export default client;
```

### Add metadata and annotations

You can add metadata and annotations to trace:

```ts

import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  const handlerSegment = tracer.getSegment()?.addNewSubsegment('### handler');
  handlerSegment && tracer.setSegment(handlerSegment); 

  tracer.putMetadata('paymentResponse', {
      foo: 'bar',
    });
  tracer.putAnnotation('successfulBooking', true);

  handlerSegment?.close();
  handlerSegment && tracer.setSegment(handlerSegment?.parent); 
};
```

## Contribute

If you are interested in contributing to this project, please refer to
our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities
by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues),
or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub
repository.

## Connect

- **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
- **Email**: <aws-lambda-powertools-feedback@amazon.com>

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company
is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by
raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://s12d.com/become-reference-pt-ts)
issue.

The following companies, among others, use Powertools:

- [Alma Media](https://www.almamedia.fi)
- [AppYourself](https://appyourself.net)
- [Bailey Nelson](https://www.baileynelson.com.au)
- [Banxware](https://www.banxware.com)
- [Caylent](https://caylent.com/)
- [Certible](https://www.certible.com/)
- [Elva](https://elva-group.com)
- [Flyweight](https://flyweight.io/)
- [globaldatanet](https://globaldatanet.com/)
- [Guild](https://guild.com)
- [Hashnode](https://hashnode.com/)
- [LocalStack](https://localstack.cloud/)
- [Perfect Post](https://www.perfectpost.fr)
- [Sennder](https://sennder.com/)
- [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
- [Trek10](https://www.trek10.com/)
- [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and
others. Check out what the community has already shared about Powertools for AWS Lambda (
TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain
future investments for other Powertools for AWS Lambda languages.
When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/#lambda-layer), you can add Powertools as a
dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
