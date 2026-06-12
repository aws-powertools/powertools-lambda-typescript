# Powertools for AWS Lambda (TypeScript) - Signer Utility <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.aws.amazon.com/powertools/typescript/latest/#features).

You can use the package in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Key features](#key-features)
- [Usage](#usage)
    - [Signing a request](#signing-a-request)
    - [Sending signed requests](#sending-signed-requests)
    - [Using other HTTP clients](#using-other-http-clients)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
    - [Becoming a reference customer](#becoming-a-reference-customer)
    - [Sharing your work](#sharing-your-work)
    - [Using Lambda Layer](#using-lambda-layer)
- [License](#license)

## Intro

This utility provides a way to sign HTTP requests to AWS services using the [AWS Signature Version 4 (SigV4)](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv4_signing.html) signing process, so you can call IAM-authenticated endpoints such as Amazon API Gateway, AWS Lambda function URLs, or AWS AppSync from within your Lambda functions.

## Key features

- Sign web-standard `Request` objects with AWS Signature Version 4
- Drop-in signed `fetch` for sending signed requests in one step
- Works with any HTTP client by exposing the signed request and headers
- Reads credentials and region from the Lambda runtime by default, with no extra dependencies

## Usage

To get started, install the library by running:

```sh
npm install @aws-lambda-powertools/signer
```

### Signing a request

The signer takes a web-standard `Request` (or anything you can pass to `fetch`, like a URL string) and returns a new, signed `Request` with the SigV4 headers added. It performs no network I/O, so you stay in control of how the request is sent.

```typescript
import { SigV4Signer } from '@aws-lambda-powertools/signer/sigv4';

const signer = new SigV4Signer({ service: 'execute-api' });

export const handler = async () => {
  const signed = await signer.sign(
    'https://example.execute-api.us-east-1.amazonaws.com/items'
  );

  const response = await fetch(signed);
  await response.json();
};
```

By default, the signer reads the AWS credentials and region from the environment variables that the Lambda runtime always provides, so no additional configuration is required when running in Lambda.

### Sending signed requests

If all you want is to sign and immediately send the request, use `createSignedFetcher`. It consumes a signer instance and returns a function with the same signature as the global `fetch`, signing each request before sending it.

```typescript
import { createSignedFetcher } from '@aws-lambda-powertools/signer/fetch';
import { SigV4Signer } from '@aws-lambda-powertools/signer/sigv4';

const signer = new SigV4Signer({ service: 'execute-api' });
const signedFetch = createSignedFetcher(signer);

export const handler = async () => {
  const response = await signedFetch(
    'https://example.execute-api.us-east-1.amazonaws.com/items',
    {
      method: 'POST',
      body: JSON.stringify({ name: 'powertools' }),
    }
  );

  await response.json();
};
```

### Using other HTTP clients

Signing and sending are deliberately kept separate, so you can use the signed request with any HTTP client (for example `axios`, `got`, a generated SDK client, or a request interceptor). Call `sign()` to obtain a signed `Request`, then read its `url`, `method`, and `headers`.

See the [documentation](https://docs.aws.amazon.com/powertools/typescript/latest/features/signer/) for more details on configuring credentials and region, handling errors, and using other HTTP clients.

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
- [Codeac](https://www.codeac.io/)
- [EF Education First](https://www.ef.com/)
- [Elva](https://elva-group.com)
- [Flyweight](https://flyweight.io/)
- [FraudFalcon](https://fraudfalcon.app)
- [globaldatanet](https://globaldatanet.com/)
- [Guild](https://guild.com)
- [Hashnode](https://hashnode.com/)
- [Instil](https://instil.co/)
- [LocalStack](https://localstack.cloud/)
- [Ours Privacy](https://oursprivacy.com/)
- [Perfect Post](https://www.perfectpost.fr)
- [Sennder](https://sennder.com/)
- [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
- [Trek10](https://www.trek10.com/)
- [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has [already shared](https://docs.aws.amazon.com/powertools/typescript/latest/we_made_this) about Powertools for AWS Lambda (TypeScript).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.aws.amazon.com/powertools/typescript/latest/getting-started/lambda-layers/), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
