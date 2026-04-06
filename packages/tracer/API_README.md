# Powertools for AWS Lambda (TypeScript) <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.aws.amazon.com/powertools/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Usage](#usage)
    - [Basic usage](#basic-usage)
    - [Capture AWS SDK clients](#capture-aws-sdk-clients)
    - [Add metadata and annotations](#add-metadata-and-annotations)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
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

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues), or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub repository.

## Connect

- **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
- **Email**: <aws-lambda-powertools-feedback@amazon.com>
