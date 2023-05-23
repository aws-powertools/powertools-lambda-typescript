# Powertools for AWS Lambda (TypeScript) examples in SAM

This project contains source code and supporting files for a serverless application that you can deploy with the [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html). The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

This project includes the following files and folders:

- `src` - Code for the application's Lambda function written in TypeScript. See "Prepare the project" below for instructions on how to copy the Lambda handler code here.
- `events` - Invocation events that you can use to invoke the function.
- `template.yaml` - A template that defines the application's AWS resources.

The application uses several AWS resources, including Lambda functions and an API Gateway API. These resources are defined in the `template.yaml` file in this project. You can update the template to add AWS resources through the same deployment process that updates your application code.

> **Note**
> You will need to have a valid AWS Account in order to deploy these resources. These resources may incur costs to your AWS Account. The cost from **some services** are covered by the [AWS Free Tier](https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all) but not all of them. If you don't have an AWS Account follow [these instructions to create one](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/).

## Prepare the project

All the following commands in this file must be executed inside the folder `examples/sam`

Before deploying this example install the npm dependencies:

```bash
npm i
```

> **Note**
> In order to run this example you'll need [AWS SAM CLI version 1.65 or later](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html). If you have an older version of the AWS SAM CLI, see [Upgrading the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/manage-sam-cli-versions.html#manage-sam-cli-versions-upgrade).

## Deploy the sample application

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build --beta-features
sam deploy --guided
```

The first command will build the source of your application. Using esbuild for bundling Node.js and TypeScript is a beta feature, therefore we add the `--beta-features` parameter. The second command will package and deploy your application to AWS, with a series of prompts:

* **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
* **AWS Region**: The AWS region you want to deploy your app to.
* **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
* **Allow SAM CLI IAM role creation**: Many AWS SAM templates, including this example, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
* **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

You can find your API Gateway Endpoint URL in the output values displayed after deployment.

## Execute the functions via API Gateway

Use the API Gateway Endpoint URL from the output values to execute the functions. First, let's add two items to the DynamoDB Table by running:

```bash
curl -XPOST --header 'Content-Type: application/json' --data '{"id":"myfirstitem","name":"Some Name for the first item"}' https://randomid12345.execute-api.eu-central-1.amazonaws.com/Prod/
curl -XPOST --header 'Content-Type: application/json' --data '{"id":"myseconditem","name":"Some Name for the second item"}' https://randomid1245.execute-api.eu-central-1.amazonaws.com/Prod/
````

Now, let's retrieve all items by running:

```bash
curl -XGET https://randomid12345.execute-api.eu-central-1.amazonaws.com/Prod/
```

And finally, let's retrieve a specific item by running:
```bash
curl -XGET https://randomid12345.execute-api.eu-central-1.amazonaws.com/Prod/myseconditem/
```

## Observe the outputs in AWS CloudWatch & X-Ray

### CloudWatch

If we check the logs in CloudWatch, we can see that the logs are structured like this
```
2022-04-26T17:00:23.808Z	e8a51294-6c6a-414c-9777-6b0f24d8739b	DEBUG	
{
    "level": "DEBUG",
    "message": "retrieved items: 0",
    "service": "getAllItems",
    "timestamp": "2022-04-26T17:00:23.808Z",
    "awsRequestId": "e8a51294-6c6a-414c-9777-6b0f24d8739b"
}
```

By having structured logs like this, we can easily search and analyse them in [CloudWatch Logs Insight](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html). Run the following query to get all messages for a specific `awsRequestId`:

````
filter awsRequestId="bcd50969-3a55-49b6-a997-91798b3f133a"
 | fields timestamp, message
````
### AWS X-Ray

As we have enabled tracing for our Lambda-Funtions, you can visit [AWS CloudWatch Console](https://console.aws.amazon.com/cloudwatch/) and see [Traces](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-traces) and a [Service Map](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-using-xray-maps.html) for our application.

You can also use the AWS SAM CLI to retrieve traces by running `sam traces`.

## Use the SAM CLI to build and test locally

Build your application with the `sam build` command.

```bash
sam build --beta-features
```

The SAM CLI installs dependencies defined in `package.json`, compiles TypeScript with esbuild, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

Run functions locally and invoke them with the `sam local invoke` command.

```bash
sam local invoke getAllItemsFunction --event events/event-get-all-items.json
```

The SAM CLI can also emulate your application's API. Use the `sam local start-api` to run the API locally on port 3000.

```bash
sam local start-api
curl http://localhost:3000/
```

The SAM CLI reads the application template to determine the API's routes and the functions that they invoke. The `Events` property on each function's definition includes the route and method for each path.

```yaml
Events:
  HelloWorld:
    Type: Api
    Properties:
      Path: /
      Method: get
```

## Fetch, tail, and filter Lambda function logs

To simplify troubleshooting, SAM CLI has a command called `sam logs`. `sam logs` lets you fetch logs generated by your deployed Lambda function from the command line. In addition to printing the logs on the terminal, this command has several nifty features to help you quickly find the bug.

`NOTE`: This command works for all AWS Lambda functions; not just the ones you deploy using SAM.

```bash
sam logs -n getAllItemsFunction --stack-name powertools-example --tail
```

You can find more information and examples about filtering Lambda function logs in the [SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-logging.html).

## Switch to Lambda Layer

In this example we are including Powertools for AWS Lambda (TypeScript) as a dependency in our function's `package.json`. This is the recommended approach for development and testing. However, for production, you can also use Powertools for AWS as a Lambda Layer.

To start using the public Lambda Layer, you need to:
1. Specify the Layer's ARN in `Layers` section under each function's `Properties` section
2. Instruct `esbuild` to not bundle `@aws-lambda-powertools` under each function's `Metadata/BuildProperties` section

To do so, open the `template.yaml` file, and **for each Lambda Function**, update the following sections:
```diff
Resources:
  putItemFunction:
    Type: AWS::Serverless::Function
    Properties:
+     Layers:
+       - arn:aws:lambda:eu-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:6
      Handler: src/put-item.putItemHandler
      Description: A simple example includes a HTTP ost method to add one item to a DynamoDB table.
      Policies:
```

and:

```diff
Metadata: 
  # Manage esbuild properties
  BuildMethod: esbuild
  BuildProperties:
    BuildMethod: esbuild
    BuildProperties:
      Minify: true
      Target: "ES2020"
      Sourcemap: true
      External:
        - "@aws-sdk/lib-dynamodb"
        - "@aws-sdk/client-dynamodb"
+       - "@aws-lambda-powertools/commons"
+       - "@aws-lambda-powertools/logger'
+       - "@aws-lambda-powertools/metrics"
+       - "@aws-lambda-powertools/tracer"
      EntryPoints:
```

Learn more about Lambda Layers [here](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html) and about the Powertools for AWS Lambda (TypeScript) layers [here](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/#lambda-layer).

## Cleanup

To delete the sample application that you created, run the command below while in the `examples/sam` directory:

```bash
sam delete
```

## Resources

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

Next, you can use AWS Serverless Application Repository to deploy ready to use Apps that go beyond hello world samples and learn how authors developed their applications: [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)
