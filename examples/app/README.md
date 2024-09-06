# Powertools for AWS Lambda (TypeScript) examples in CDK

This is a deployable CDK app that deploys AWS Lambda functions as part of a CloudFormation stack. These Lambda functions use the utilities made available as part of Powertools for AWS Lambda (TypeScript) to demonstrate their usage.

> [!Warning]
> You will need to have a valid AWS Account in order to deploy these resources. Many of the services in the example are covered [AWS Free Tier](https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all) but you may incur charges if you exceed the free tier limits.
If you don't have an AWS Account follow [these instructions to create one](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/).

The example functions, located in the `functions` folder, are frontend by a REST API that is deployed using AWS API Gateway.

The API has three endpoints:

* `POST /` - Adds an item to the DynamoDB table
* `GET /` - Retrieves all items from the DynamoDB table
* `GET /{id}` - Retrieves a specific item from the DynamoDB table

## Deploying the stack

> [!Note]
> The `examples/app` directory where this example is located is part of a monorepo. If you are interested in deploying the example only, follow the instructions below.
> If instead you are working on the monorepo and want to deploy the example, follow the instructions in the [CONTRIBUTING](../../CONTRIBUTING.md#dev-setup) doc, then run `npm run cdk deploy -w examples/app` from the project's root.

If this is the first time you're using CDK in your AWS Account & AWS Region, you may need to run `npm run cdk bootstrap aws://<YOU_AWS_ACCOUNT_ID>/<AWS_REGION> --profile <YOUR_AWS_PROFILE>` to bootstrap your account for CDK.

Then, still from within the `examples/app` directory, run the following commands:

* `npm i --prefix ./` to install the dependencies
* `npm run cdk deploy` and follow the prompts to deploy the stack

When the deployment is complete, you will see the output values that include the API Gateway Endpoint URL.

## Execute the functions via API Gateway

Use the API Gateway Endpoint URL from the output values to execute the functions. First, let's add two items to the DynamoDB Table by running:

```bash
curl -XPOST --header 'Content-Type: application/json' --data '{"id":"myfirstitem","name":"Some Name for the first item"}' https://<api-id>.execute-api.eu-central-1.amazonaws.com/prod/
curl -XPOST --header 'Content-Type: application/json' --data '{"id":"myseconditem","name":"Some Name for the second item"}' https://<api-id>.execute-api.eu-central-1.amazonaws.com/prod/
````

Now, let's retrieve all items by running:

```sh
curl -XGET https://<api-id>.execute-api.eu-central-1.amazonaws.com/prod/
```

And finally, let's retrieve a specific item by running:

```bash
curl -XGET https://<api-id>.execute-api.eu-central-1.amazonaws.com/prod/myseconditem/
```

## Observe the outputs in AWS CloudWatch & X-Ray

### CloudWatch

If we check the logs in CloudWatch, we can see that the logs are structured like this

```text
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

````text
filter awsRequestId="bcd50969-3a55-49b6-a997-91798b3f133a"
 | fields timestamp, message
````

### AWS X-Ray

As we have enabled tracing for our Lambda-Funtions, you can visit [AWS CloudWatch Console](https://console.aws.amazon.com/cloudwatch/) and see [Traces](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-traces) and a [Service Map](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-using-xray-maps.html) for our application.

## Cleanup

To delete the sample application that you created, run the command below while in the `examples/cdk` directory:

```bash
cdk destroy
```
