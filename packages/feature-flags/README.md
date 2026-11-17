# Powertools for AWS Lambda (TypeScript) - Feature Flags <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.aws.amazon.com/powertools/typescript/latest/#features).

- [Intro](#intro)
- [Usage](#usage)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [License](#license)

## Intro

The Feature Flags utility evaluates flags against caller-supplied context. Use a local rule engine over a Powertools for Python freeform Flag Document, AWS AppConfig Agent-selected variants, or your own Store. Every evaluation has an explicit fallback for a missing flag or an availability failure.

## Usage

Install the core utility for local rules or custom Stores:

```sh
npm install @aws-lambda-powertools/feature-flags
```

```typescript
import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';

const flags = new FeatureFlags({
  store: ruleEngineStore({
    source: async () => ({
      checkout_v2: {
        default: false,
        rules: {
          premium_customers: {
            when_match: true,
            conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
          },
        },
      },
    }),
  }),
});

export const handler = async () => {
  return flags.evaluate({
    name: 'checkout_v2',
    context: { tier: 'premium' },
    default: false,
  });
};
```

See the [Feature Flags documentation](https://docs.aws.amazon.com/powertools/typescript/latest/features/feature-flags/) for AppConfig installation, IAM permissions, variants, result validation, and testing.

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

Follow [issue #3754](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3754) for Feature Flags implementation progress.

## Connect

- **Powertools for AWS Lambda on GitHub Discussions**: [Join the conversation](https://github.com/aws-powertools/powertools-lambda-typescript/discussions)
- **Email**: <aws-lambda-powertools-feedback@amazon.com>

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
