# Powertools for AWS Lambda (TypeScript) - Event Handler Utility

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.aws.amazon.com/powertools/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

## Intro

Event handler for Amazon API Gateway REST and HTTP APIs, Application Load Balancer (ALB), Lambda Function URLs, AWS AppSync GraphQL APIs, and AWS AppSync Events APIs.

## Usage

To get started, install the library by running:

```sh
npm i @aws-lambda-powertools/event-handler
```

## HTTP

Event Handler for Amazon API Gateway REST and HTTP APIs, Application Load Balancer (ALB), and Lambda Function URLs.

* Lightweight routing to reduce boilerplate for API Gateway REST/HTTP API, ALB and Lambda Function URLs
* Web standards based - incoming events are automatically converted into [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) objects, and you can return [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) objects from your handlers
* Automatic event type detection and response format transformation, so you can swap integrations (e.g. from ALB to API Gateway) with little to no code changes
* Built-in middleware engine for request/response transformation and validation
* Works with micro function (one or a few routes) and monolithic functions

### Handle HTTP requests

You can register handlers for specific HTTP methods and paths using the corresponding method, for example `get()` or `post()`. The handler will be called whenever a request matches the method and path.

```typescript
import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

app.get('/todos', async () => {
  // your logic here
  return [
    {
      id: 'todo-id',
      title: 'Todo Title',
      completed: false,
    },
  ];
});

app.post('/todos', async ({ req }) => {
  const body = await req.json();
  // your logic here
  return body;
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
```

### Dynamic routes

You can use dynamic path parameters in your routes, which are automatically parsed and passed to your handler.

```typescript
import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

app.get('/todos/:todoId', async ({ params: { todoId } }) => {
  // your logic here
  return {
    id: todoId,
    title: 'Todo Title',
    completed: false,
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
```

There's much more to the HTTP event handler, including:

* Request and response validation using [Standard Schema](https://standardschema.dev) compatible libraries like Zod, Valibot, and ArkType
* Error handling with built-in and custom error handlers, and typed HTTP errors
* CORS, compression, and AWS X-Ray tracing via built-in middleware
* Split routers to organize routes across multiple files
* Response streaming and binary responses

See the [documentation](https://docs.aws.amazon.com/powertools/typescript/latest/features/event-handler/http) for more details on how to use the HTTP event handler.

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

See the [documentation](https://docs.aws.amazon.com/powertools/typescript/latest/features/event-handler/appsync-events) for more details on how to use the AppSync Events event handler.

## AppSync GraphQL

The Event Handler for AWS AppSync GraphQL APIs allows you to easily handle GraphQL requests in your Lambda functions. It enables you to define resolvers for GraphQL types and fields, making it easier to handle GraphQL requests without the need for complex VTL or JavaScript templates.

* Route events based on GraphQL type and field keys
* Automatically parse API arguments to function parameters
* Handle GraphQL responses and errors in the expected format

### Handle query requests

When registering a resolver for a Query type, you can use the `onQuery()` method. This method allows you to define a function that will be invoked when a GraphQL Query is made.

```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'TodoManager',
});
const app = new AppSyncGraphQLResolver({ logger });

app.onQuery<{ id: string }>('getTodo', async ({ id }) => {
  logger.debug('Resolving todo', { id });
  // Simulate fetching a todo from a database or external service
  return {
    id,
    title: 'Todo Title',
    completed: false,
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
```

### Handle mutation requests

Similarly, you can register a resolver for a Mutation type using the `onMutation()` method. This method allows you to define a function that will be invoked when a GraphQL Mutation is made.

```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import {
  AppSyncGraphQLResolver,
  makeId,
} from '@aws-lambda-powertools/event-handler/appsync-graphql';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'TodoManager',
});
const app = new AppSyncGraphQLResolver({ logger });

app.onMutation<{ title: string }>('createTodo', async ({ title }) => {
  logger.debug('Creating todo', { title });
  const todoId = makeId();
  // Simulate creating a todo in a database or external service
  return {
    id: todoId,
    title,
    completed: false,
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
```

### Generic resolver

When you want to have more control over the type and field, you can use the `resolver()` method. This method allows you to register a function for a specific GraphQL type and field including custom types.

```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'TodoManager',
});
const app = new AppSyncGraphQLResolver({ logger });

app.resolver(
  async () => {
    logger.debug('Resolving todos');
    // Simulate fetching a todo from a database or external service
    return [
      {
        id: 'todo-id',
        title: 'Todo Title',
        completed: false,
      },
      {
        id: 'todo-id-2',
        title: 'Todo Title 2',
        completed: true,
      },
    ];
  },
  {
    fieldName: 'listTodos',
    typeName: 'Query',
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
```

See the [documentation](https://docs.aws.amazon.com/powertools/typescript/latest/features/event-handler/appsync-graphql) for more details on how to use the AppSync GraphQL event handler.

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
* [Codeac](https://www.codeac.io/)
* [EF Education First](https://www.ef.com/)
* [Elva](https://elva-group.com)
* [Flyweight](https://flyweight.io/)
* [FraudFalcon](https://fraudfalcon.app)
* [globaldatanet](https://globaldatanet.com/)
* [Guild](https://guild.com)
* [Hashnode](https://hashnode.com/)
* [Instil](https://instil.co/)
* [LocalStack](https://localstack.cloud/)
* [Ours Privacy](https://oursprivacy.com/)
* [Perfect Post](https://www.perfectpost.fr)
* [Sennder](https://sennder.com/)
* [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
* [Trek10](https://www.trek10.com/)
* [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has [already shared](https://docs.aws.amazon.com/powertools/typescript/latest/we_made_this) about Powertools for AWS Lambda (TypeScript).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.aws.amazon.com/powertools/typescript/latest/getting-started/lambda-layers/), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
