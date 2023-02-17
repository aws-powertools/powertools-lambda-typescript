# Lambda Powertools for TypeScript Layer Publisher

This CDK app is meant to be used to publish Powertools for TypeScript Lambda Layer. It is composed of a single stack deploying the Layer into the target account.

# Usage

```sh
npm ci
npm run cdk deploy
```

By default it will package the layer with the latest version publicly available but you can force the public version to use with `PowerToolsPackageVersion` context variable:
   ```sh
   npm run cdk deploy -- --context PowerToolsPackageVersion='0.9.0'
   ```

# Tests

## Units

```sh
npm run test
```

## E2E

This will deploy and destroy several stacks in your AWS Account

```sh
npm run test:e2e
```

PS: You can force 
* the lambda runtime to test with the RUNTIME env variable
* the Powertools version with VERSION env variable
```sh 
RUNTIME=node12.x VERSION=0.9.0 npm run test:e2e
```