# AWS Lambda Powertools for TypeScript examples in SAM

This project contains source code and supporting files for a serverless application that you can deploy with the [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html). The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

This project includes the following files and folders:

- `src/handlers` - Code for the application's Lambda function written in TypeScript. See "Prepare the project" below for instructions on how to copy the Lambda handler code here.
- `events` - Invocation events that you can use to invoke the function.
- `template.yaml` - A template that defines the application's AWS resources.

The application uses several AWS resources, including Lambda functions and an API Gateway API. These resources are defined in the `template.yaml` file in this project. You can update the template to add AWS resources through the same deployment process that updates your application code.

If you prefer to use an integrated development environment (IDE) to build and test your application, you can use the AWS Toolkit.  
The AWS Toolkit is an open source plug-in for popular IDEs that uses the SAM CLI to build and deploy serverless applications on AWS. The AWS Toolkit also adds a simplified step-through debugging experience for Lambda function code. See the following links to get started.

* [CLion](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [GoLand](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [IntelliJ](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [WebStorm](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [Rider](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [PhpStorm](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [PyCharm](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [RubyMine](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [DataGrip](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html)
* [Visual Studio](https://docs.aws.amazon.com/toolkit-for-visual-studio/latest/user-guide/welcome.html)

You will need to have a valid AWS Account in order to deploy these resources. These resources may incur costs to your AWS Account. The cost from **some services** are covered by the [AWS Free Tier](https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all) but not all of them. If you don't have an AWS Account follow [these instructions to create one](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/).

## Prepare the project

All the following commands in this file must be executed inside the folder `examples/sam`

Before deploying this example install the npm dependencies:

```bash
npm i
```

In addition to the [recommended setup for this project](https://github.com/awslabs/aws-lambda-powertools-typescript/blob/main/CONTRIBUTING.md#setup), you'll need the [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html). 

## Deploy the sample application

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build  --beta-features
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
````

And finally, let's retrieve a specific item by running:
```bash
https://randomid12345.execute-api.eu-central-1.amazonaws.com/Prod/myseconditem/
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
As we have enabled tracing for our Lambda-Funtions, we can visit [AWS X-Ray Console](https://console.aws.amazon.com/xray/home#/traces/) and see [traces](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-traces) and a [service map](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-using-xray-maps.html) for our application.

## Use the SAM CLI to build and test locally

Build your application with the `sam build` command.

```bash
sam build --beta-features
```

The SAM CLI installs dependencies defined in `src/handlers/package.json`, compiles TypeScript with esbuild, creates a deployment package, and saves it in the `.aws-sam/build` folder.

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


## Cleanup

To delete the sample application that you created, run the command below while in the `examples/sam` directory:

```bash
sam delete
```

## Resources

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

Next, you can use AWS Serverless Application Repository to deploy ready to use Apps that go beyond hello world samples and learn how authors developed their applications: [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)
