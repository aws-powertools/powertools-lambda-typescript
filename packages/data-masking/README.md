# Powertools for AWS Lambda (TypeScript) - Data Masking Utility

The data masking utility can encrypt, decrypt, or irreversibly erase sensitive information to protect data confidentiality.

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.aws.amazon.com/powertools/typescript/latest/#features). You can use the library in both TypeScript and JavaScript code bases.

To get started, install the package by running:

```sh
npm i @aws-lambda-powertools/data-masking
```

## Key features

* Encrypt, decrypt, or irreversibly erase data with ease
* Erase sensitive information in one or more fields within nested data
* Seamless integration with [AWS Encryption SDK](https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/introduction.html) for industry and AWS security best practices

## Usage

### Erasing data

Erasing will remove the original data and replace it with `*****`. This means you cannot recover erased data, and the data type will change to `string` for all erased values.

Field paths support dot notation and `.*`/`[*]` wildcards to reach nested data.

```typescript
import { DataMasking } from '@aws-lambda-powertools/data-masking';

const masker = new DataMasking();

const data = {
  name: 'Jane Doe',
  customer: { ssn: '123-45-6789', city: 'Anytown' },
  orders: [{ id: 1, card: '4111-1111-1111-1111' }],
};

const masked = masker.erase(data, {
  fields: ['customer.ssn', 'orders[*].card'],
});
// {
//   name: 'Jane Doe',
//   customer: { ssn: '*****', city: 'Anytown' },
//   orders: [{ id: 1, card: '*****' }],
// }
```

You can also use custom masking rules to partially mask data while keeping some of its structure, for example to preserve the domain of an email address or the length of a value:

```typescript
import { DataMasking } from '@aws-lambda-powertools/data-masking';

const masker = new DataMasking();

const masked = masker.erase(
  { email: 'jane@example.com', ssn: '123-45-6789' },
  {
    maskingRules: {
      email: { regexPattern: /(.)(.+?)(@.*)/, maskFormat: '$1****$3' },
      ssn: { dynamicMask: true },
    },
  }
);
// { email: 'j****@example.com', ssn: '***********' }
```

### Encrypting and decrypting data

To encrypt and decrypt data, you need an encryption provider. By default, we use Amazon Key Management Service (KMS) via the AWS Encryption SDK provider, which is available as its own sub-path export so the `@aws-crypto/client-node` peer dependency is only required when you use it:

```sh
npm i @aws-crypto/client-node
```

```typescript
import { DataMasking } from '@aws-lambda-powertools/data-masking';
import { AWSEncryptionSDKProvider } from '@aws-lambda-powertools/data-masking/providers/kms';

const masker = new DataMasking({
  provider: new AWSEncryptionSDKProvider({
    keys: ['arn:aws:kms:us-east-1:123456789012:key/my-key'],
  }),
});

const encrypted = await masker.encrypt(data, {
  fields: ['customer.ssn'],
});

const decrypted = await masker.decrypt(encrypted, {
  fields: ['customer.ssn'],
});
```

For more information on how to use this utility, please refer to the [documentation](https://docs.aws.amazon.com/powertools/typescript/latest/features/data-masking).

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
