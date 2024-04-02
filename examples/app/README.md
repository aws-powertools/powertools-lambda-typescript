# Powertools for AWS Lambda (TypeScript) examples in CDK

This is a deployable CDK app that deploys AWS Lambda functions as part of a CloudFormation stack. These Lambda functions use the utilities made available as part of Powertools for AWS Lambda (TypeScript) to demonstrate their usage.

> **Note**
> You will need to have a valid AWS Account in order to deploy these resources. These resources may incur costs to your AWS Account. The cost from **some services** are covered by the [AWS Free Tier](https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all) but not all of them. If you don't have an AWS Account follow [these instructions to create one](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/).

The example functions, located in the `functions` folder, are frontend by a REST API that is deployed using AWS API Gateway.

The API has three endpoints:

 * `POST /` - Adds an item to the DynamoDB table
 * `GET /` - Retrieves all items from the DynamoDB table
 * `GET /{id}` - Retrieves a specific item from the DynamoDB table

## Deploying the stack

 * Navigate to this location of the repo in your terminal (`examples/cdk`)
 * `npm ci`
 * `npm run cdk deploy --all --profile <YOUR_AWS_PROFILE>`

Note: Prior to deploying you may need to run `cdk bootstrap aws://<YOU_AWS_ACCOUNT_ID>/<AWS_REGION> --profile <YOUR_AWS_PROFILE>` if you have not already bootstrapped your account for CDK.

> **Note**
> You can find your API Gateway Endpoint URL in the output values displayed after deployment.

## Execute the functions via API Gateway

Use the API Gateway Endpoint URL from the output values to execute the functions. First, let's add two items to the DynamoDB Table by running:

```bash
curl -XPOST --header 'Content-Type: application/json' --data '{"id":"myfirstitem","name":"Some Name for the first item"}' https://randomid12345.execute-api.eu-central-1.amazonaws.com/prod/
curl -XPOST --header 'Content-Type: application/json' --data '{"id":"myseconditem","name":"Some Name for the second item"}' https://randomid1245.execute-api.eu-central-1.amazonaws.com/prod/
````

Now, let's retrieve all items by running:

```sh
curl -XGET https://randomid12345.execute-api.eu-central-1.amazonaws.com/prod/
```

And finally, let's retrieve a specific item by running:
```bash
curl -XGET https://randomid12345.execute-api.eu-central-1.amazonaws.com/prod/myseconditem/
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

## Cleanup

To delete the sample application that you created, run the command below while in the `examples/cdk` directory:

```bash
cdk destroy
```