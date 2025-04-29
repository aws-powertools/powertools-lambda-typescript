# Powertools for AWS Lambda (TypeScript) - Event Handler Utility

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

## Intro

Event handler for Amazon API Gateway REST and HTTP APIs, Application Loader Balancer (ALB), Lambda Function URLs, and VPC Lattice.

## Usage

To get started, install the library by running:

```sh
npm i @aws-lambda-powertools/event-handler
```

## AppSync Events

Event Handler for AWS AppSync real-time events.

* Easily handle publish and subscribe events with dedicated handler methods
* Automatic routing based on namespace and channel patterns
* Support for wildcard patterns to create catch-all handlers
* Process events in parallel corontrol aggregation for batch processing
* Graceful error handling for individual events

### Handle publish events

When using the publish event handler, you can register a handler for a specific channel or a wildcard pattern. The handler will be called once for each message received on that channel.

```typescript
import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';

const app = new AppSyncEventsResolver();

app.onPublish('/default/foo', async (payload) => {
  // your logic here
  return payload;
});

export const handler = async (event, context) =>
  app.resolve(event, context);
```

In some cases, you might want to process all the messages at once, for example to optimize downstream operations. In this case, you can set the `aggregate` option to `true` when registering the handler. This will cause the handler to be called once for all messages received on that channel.

```typescript
import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';

const app = new AppSyncEventsResolver();

app.onPublish('/default/foo', async (payloads) => {
  const newMessages = [];
  for (const message of payloads) {
    // your logic here
  }

  return newMessages;
}, {
  aggregate: true
});

export const handler = async (event, context) =>
  app.resolve(event, context);
```

### Handle subscribe events

You can also register a handler for subscribe events. This handler will be called once for each subscription request received on the specified channel. You can use this handler to perform any necessary setup or validation before allowing the subscription to proceed.

```typescript
import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';

const app = new AppSyncEventsResolver();

app.onSubscribe('/default/foo', async (event) => {
  // your logic here
});

export const handler = async (event, context) =>
  app.resolve(event, context);
```

If you want to reject a subscription request, you can throw an `UnauthorizedException` error. This will cause the subscription to be rejected and the client will receive an error message.

```typescript
import {
  AppSyncEventsResolver,
  UnauthorizedException,
} from '@aws-lambda-powertools/event-handler/appsync-events';

const app = new AppSyncEventsResolver();

app.onSubscribe('/default/foo', async (event) => {
  // your logic here
  throw new UnauthorizedException('Unauthorized');
});

export const handler = async (event, context) =>
  app.resolve(event, context);
```

See the [documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/event-handler/appsync-events) for more details on how to use the AppSync event handler.

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues), or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub repository.

## Connect

* **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
* **Email**: <aws-lambda-powertools-feedback@amazon.com>

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://s12d.com/become-reference-pt-ts) issue.

The following companies, among others, use Powertools:

* [Alma Media](https://www.almamedia.fi)
* [AppYourself](https://appyourself.net)
* [Bailey Nelson](https://www.baileynelson.com.au)
* [Banxware](https://www.banxware.com)
* [Caylent](https://caylent.com/)
* [Certible](https://www.certible.com/)
* [Elva](https://elva-group.com)
* [Flyweight](https://flyweight.io/)
* [globaldatanet](https://globaldatanet.com/)
* [Guild](https://guild.com)
* [Hashnode](https://hashnode.com/)
* [LocalStack](https://localstack.cloud/)
* [Ours Privacy](https://oursprivacy.com/)
* [Perfect Post](https://www.perfectpost.fr)
* [Sennder](https://sennder.com/)
* [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
* [Trek10](https://www.trek10.com/)
* [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/#lambda-layer), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
