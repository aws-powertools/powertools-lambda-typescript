# Powertools for AWS Lambda (TypeScript)

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

- [Usage](#usage)
    - [Flushing metrics](#flushing-metrics)
    - [Capturing cold start as a metric](#capturing-cold-start-as-a-metric)
    - [Class method decorator](#class-method-decorator)
    - [Middy.js middleware](#middyjs-middleware)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
    - [Becoming a reference customer](#becoming-a-reference-customer)
    - [Sharing your work](#sharing-your-work)
    - [Using Lambda Layer](#using-lambda-layer)
- [License](#license)

## Usage

The library provides a utility function to emit metrics to CloudWatch using [Embedded Metric Format (EMF)](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html).

To get started, install the library by running:

```sh
npm i @aws-lambda-powertools/metrics
```

After initializing the Metrics class, you can add metrics using the [Metrics.addMetric](`addMetric()`) method. The metrics are stored in a buffer and are flushed when calling [Metrics.publishStoredMetrics](`publishStoredMetrics()`). Each metric can have dimensions and metadata added to it.

```ts
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
  defaultDimensions: { environment: process.env.ENVIRONMENT },
});

export const handler = async (event: { requestId: string }) => {
  metrics.addMetadata('request_id', event.requestId);
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  metrics.publishStoredMetrics();
};
```

### Flushing metrics

As you finish adding all your metrics, you need to serialize and "flush them" by calling [publishStoredMetrics()](`publishStoredMetrics()`), which will emit the metrics to stdout in the Embedded Metric Format (EMF). The metrics are then picked up by the Lambda runtime and sent to CloudWatch.

When you

### Capturing cold start as a metric

You can flush metrics automatically using one of the following methods:

### Class method decorator

If you are using TypeScript and are comfortable with writing classes, you can use the `@logMetrics()` decorator to automatically flush metrics at the end of your Lambda function as well as configure additional options such as throwing an error if no metrics are added, capturing cold start as a metric, and more.

```ts
import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

class Lambda implements LambdaInterface {
  ⁣@metrics.logMetrics({ captureColdStartMetric: true, throwOnEmptyMetrics: true })
  public async handler(event: { requestId: string }, _: Context) {
    metrics.addMetadata('request_id', event.requestId);
    metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
```

Decorators are a Stage 3 proposal for JavaScript and are not yet part of the ECMAScript standard. The current implmementation in this library is based on the legacy TypeScript decorator syntax enabled by the [`experimentalDecorators` flag](https://www.typescriptlang.org/tsconfig/#experimentalDecorators) set to `true` in the `tsconfig.json` file.

### Middy.js middleware

If instead you are using [Middy.js](http://middy.js.org) and prefer to use middleware, you can use the `@logMetrics()` middleware to do the same as the class method decorator.

The `@logMetrics()` middleware can be used with Middy.js to automatically flush metrics at the end of your Lambda function as well as configure additional options such as throwing an error if no metrics are added, capturing cold start as a metric, and set default dimensions.

```ts
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = middy(async (event) => {
  metrics.addMetadata('request_id', event.requestId);
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
}).use(logMetrics(metrics, {
  captureColdStartMetric: true,
  throwOnEmptyMetrics: true,
}));
```

The `logMetrics()` middleware is compatible with `@middy/core@3.x` and above.

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
