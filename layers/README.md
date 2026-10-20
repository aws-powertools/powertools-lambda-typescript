# Powertools for AWS Lambda (TypeScript) Layer Publisher

This CDK app is meant to be used to publish Powertools for AWS Lambda (TypeScript) Lambda Layer. It is composed of a single stack deploying the Layer into the target account.

## Usage

```sh
npm ci
npm run cdk deploy
```

By default it will package the layer with the latest version publicly available but you can force the public version to use with `PowerToolsPackageVersion` context variable:

   ```sh
   npm run cdk deploy -- --context PowerToolsPackageVersion='0.9.0'
   ```

## Tests

### Units

```sh
npm run test
```

### E2E

This will deploy and destroy several stacks in your AWS Account

```sh
npm run test:e2e
```

PS: You can force

* the lambda runtime to test with the RUNTIME env variable
* the Powertools for AWS Lambda (TypeScript) version with VERSION env variable

```sh
RUNTIME=node12.x VERSION=0.9.0 npm run test:e2e
```

## How to add new region

* Activate new region in your TEST and PROD accounts
* Bootstrap a CDKToolkit stack in the new region

```shell
 cdk bootstrap aws://AWS_ACCOUNT/NEW_REGION   
```

* Deploy the first layer version to the new region, make sure to set the NEW_REGION in your AWS CLI configuration correctly, otherwise you will deploy to the wrong region

```shell
npm run cdk -w layers -- deploy --app cdk.out --context region=NEW_REGION 'LayerPublisherStack' --require-approval never --verbose 
```

* Run the bumper script to bring all layers to the same version across all regions
* Add new region to the worklflow in `./github/workflows/reusable_deploy_layer_stack.yml`
* Document new region in `docs/index.md`
