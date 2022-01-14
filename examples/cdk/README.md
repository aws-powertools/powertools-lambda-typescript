# AWS Lambda Powertools (TypeScript) examples in CDK

This is a deployable CDK app that deploys AWS Lambda functions as part of a CloudFormation stack. These Lambda functions use the utilities made available as part of AWS Lambda Powertools (TypeScript) to demonstrate their usage.

The example functions, located in the `lib` folder, are triggered automatically when deployed using the CDK construct defined in `lib/example-function.ts`.

## Deploying the stack

 * Navigate to this location of the repo in your terminal (`examples/cdk`)
 * `npm install`
 * `npx cdk deploy --all --profile <YOUR_AWS_PROFILE>`

Note: Prior to deploying you may need to run `npx cdk bootstrap aws://<YOU_AWS_ACCOUNT_ID>/<AWS_REGION> --profile <YOUR_AWS_PROFILE>` if you have not already bootstrapped your account for CDK.

## Viewing Utility Outputs

All utility outputs can be viewed from the CloudWatch console.

 * `Logger` outputs to Logs > Log groups
 * `Metrics` outputs to Metrics > All metrics > LambdaPowertoolsTypeScript-CDKExample
 * `Tracer` outputs to  X-Ray traces > Traces
