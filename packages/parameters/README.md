# Powertools for AWS Lambda (TypeScript) <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the package in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Key features](#key-features)
- [Usage](#usage)
  - [Fetching parameters from AWS SSM Parameter Store](#fetching-parameters-from-aws-ssm-parameter-store)
  - [Getting secrets from Amazon Secrets Manager](#getting-secrets-from-amazon-secrets-manager)
  - [Retrieving values from Amazon DynamoDB](#retrieving-values-from-amazon-dynamodb)
  - [Fetching configs from AWS AppConfig](#fetching-configs-from-aws-appconfig)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
  - [Becoming a reference customer](#becoming-a-reference-customer)
  - [Sharing your work](#sharing-your-work)
  - [Using Lambda Layer](#using-lambda-layer)
- [Credits](#credits)
- [License](#license)

## Intro

The Parameters utility provides high-level functions to retrieve one or multiple parameter values from [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html), [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html), [AWS AppConfig](https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html), [Amazon DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html), or your own parameter store.

## Key features

* Retrieve one or multiple parameters from the underlying provider
* Cache parameter values for a given amount of time (defaults to 5 seconds)
* Transform parameter values from JSON or base64 encoded strings
* Bring Your Own Parameter Store Provider

## Usage

### Fetching parameters from AWS SSM Parameter Store

To get started, install the library and the corresponding AWS SDK for JavaScript v3:

```sh
npm install @aws-lambda-powertools/parameters @aws-sdk/client-ssm
```

Next, review the IAM permissions attached to your AWS Lambda function and make sure you allow the [actions detailed](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#iam-permissions) in the documentation of the utility.

You can retrieve a single parameter using the `getParameter` high-level function.

```ts
import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<void> => {
  // Retrieve a single parameter
  const parameter = await getParameter('/my/parameter');
  console.log(parameter);
};
```

For multiple parameters, you can use `getParameters` to recursively fetch all parameters under a path:

```ts
import { getParameters } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<void> => {
  /**
   * Retrieve multiple parameters from a path prefix recursively.
   * This returns an object with the parameter name as key
   */
  const parameters = await getParameters('/my/path/prefix');
  for (const [key, value] of Object.entries(parameters || {})) {
    console.log(`${key}: ${value}`);
  }
};
```

To fetch disctinct parameters using their full name, you can use the `getParametersByName` function:

```ts
import { Transform } from '@aws-lambda-powertools/parameters';
import { getParametersByName } from '@aws-lambda-powertools/parameters/ssm';
import type { SSMGetParametersByNameOptions } from '@aws-lambda-powertools/parameters/ssm/types';

const props: Record<string, SSMGetParametersByNameOptionsInterface> = {
  '/develop/service/commons/telemetry/config': {
    maxAge: 300,
    transform: Transform.JSON,
  },
  '/no_cache_param': { maxAge: 0 },
  '/develop/service/payment/api/capture/url': {}, // When empty or undefined, it uses default values
};

export const handler = async (): Promise<void> => {
  // This returns an object with the parameter name as key
  const parameters = await getParametersByName(props, { maxAge: 60 });
  for (const [key, value] of Object.entries(parameters)) {
    console.log(`${key}: ${value}`);
  }
};
```

Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#fetching-parameters) for more examples, and [the advanced section](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#advanced) for details about caching, transforms, customizing the underlying SDK, and more.

### Getting secrets from Amazon Secrets Manager

To get started, install the library and the corresponding AWS SDK for JavaScript v3:

```sh
npm install @aws-lambda-powertools/parameters @aws-sdk/client-secrets-manager
```

Next, review the IAM permissions attached to your AWS Lambda function and make sure you allow the [actions detailed](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#iam-permissions) in the documentation of the utility.

You can fetch secrets stored in Secrets Manager using the `getSecret` function:

```ts
import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

export const handler = async (): Promise<void> => {
  // Retrieve a single secret
  const secret = await getSecret('my-secret');
  console.log(secret);
};
```

Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#fetching-secrets) for more examples, and [the advanced section](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#advanced) for details about caching, transforms, customizing the underlying SDK, and more.

### Retrieving values from Amazon DynamoDB

To get started, install the library and the corresponding AWS SDK for JavaScript v3:

```sh
npm install @aws-lambda-powertools/parameters @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb
```

Next, review the IAM permissions attached to your AWS Lambda function and make sure you allow the [actions detailed](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#iam-permissions) in the documentation of the utility.

You can retrieve a single parameter from DynamoDB using the `DynamoDBProvider.get()` method:

```ts
import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';

const dynamoDBProvider = new DynamoDBProvider({ tableName: 'my-table' });

export const handler = async (): Promise<void> => {
  // Retrieve a value from DynamoDB
  const value = await dynamoDBProvider.get('my-parameter');
  console.log(value);
};
```

For retrieving multiple parameters, you can use the `DynamoDBProvider.getMultiple()` method instead:

```ts
import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';

const dynamoDBProvider = new DynamoDBProvider({ tableName: 'my-table' });

export const handler = async (): Promise<void> => {
  /**
   * Retrieve multiple values by performing a Query on the DynamoDB table.
   * This returns a dict with the sort key attribute as dict key.
   */
  const values = await dynamoDBProvider.getMultiple('my-hash-key');
  for (const [key, value] of Object.entries(values || {})) {
    // key: param-a
    // value: my-value-a
    console.log(`${key}: ${value}`);
  }
};
```

Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#fetching-secrets) for more examples, and [the advanced section](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#advanced) for details about caching, transforms, customizing the underlying SDK, and more.


### Fetching configs from AWS AppConfig

To get started, install the library and the corresponding AWS SDK for JavaScript v3:

```sh
npm install @aws-lambda-powertools/parameters @aws-sdk/client-appconfigdata
```

Next, review the IAM permissions attached to your AWS Lambda function and make sure you allow the [actions detailed](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#iam-permissions) in the documentation of the utility.

You can fetch application configurations in AWS AppConfig using the `getAppConfig` function:

```ts
import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';

export const handler = async (): Promise<void> => {
  // Retrieve a configuration, latest version
  const config = await getAppConfig('my-configuration', {
    environment: 'my-env',
    application: 'my-app',
  });
  console.log(config);
};
```

Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#fetching-app-configurations) for more examples, and [the advanced section](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#advanced) for details about caching, transforms, customizing the underlying SDK, and more.

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

[The roadmap](https://docs.powertools.aws.dev/lambda/typescript/latest/roadmap/) of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
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
* [Banxware](https://www.banxware.com)
* [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](#lambda-layers), you can add Powertools for AWS Lambda (TypeScript) as a dev dependency (or as part of your virtual env) to not impact the development process.

## Credits

Credits for the Powertools for AWS Lambda (TypeScript) idea go to [DAZN](https://github.com/getndazn) and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/).

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
