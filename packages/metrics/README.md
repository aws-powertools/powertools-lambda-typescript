# Powertools for AWS Lambda (TypeScript) <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Usage](#usage)
    - [Basic usage](#basic-usage)
    - [Flushing metrics](#flushing-metrics)
    - [Capturing cold start as a metric](#capturing-cold-start-as-a-metric)
    - [Adding metadata](#adding-metadata)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
    - [Becoming a reference customer](#becoming-a-reference-customer)
    - [Sharing your work](#sharing-your-work)
    - [Using Lambda Layer](#using-lambda-layer)
- [License](#license)

## Intro

## Usage

To get started, install the library by running:

```sh
npm i @aws-lambda-powertools/metrics
```

### Basic usage

The library provides a utility function to emit metrics to CloudWatch using [Embedded Metric Format (EMF)](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html).

```ts
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
};
```

### Flushing metrics

As you finish adding all your metrics, you need to serialize and "flush them" by calling publishStoredMetrics(). This will print the metrics to standard output.

You can flush metrics automatically using one of the following methods:

- manually by calling `publishStoredMetrics()` at the end of your Lambda function

```ts
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  metrics.publishStoredMetrics();
};
```

- middy compatible middleware `logMetrics()`

```ts
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
};

export const handler = middy(lambdaHandler).use(logMetrics(metrics));
```

- using decorator `@logMetrics()`

```ts
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

class Lambda implements LambdaInterface {
  @metrics.logMetrics()
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); 
```

Using the Middy middleware or decorator will automatically validate, serialize, and flush all your metrics.

### Capturing cold start as a metric

You can optionally capture cold start metrics with the logMetrics middleware or decorator via the captureColdStartMetric param.

```ts
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export class MyFunction implements LambdaInterface {
  @metrics.logMetrics({ captureColdStartMetric: true })
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  }
}
```

### Adding metadata

You can add high-cardinality data as part of your Metrics log with the `addMetadata` method. This is useful when you want to search highly contextual information along with your metrics in your logs.

```ts
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  metrics.addMetadata('bookingId', '7051cd10-6283-11ec-90d6-0242ac120003');
};

export const handler = middy(lambdaHandler).use(logMetrics(metrics));
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
