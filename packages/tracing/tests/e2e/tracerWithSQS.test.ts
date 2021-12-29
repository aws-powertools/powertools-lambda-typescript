// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Test metrics decorator
 *
 * @group e2e/tracer/sqs
 */

import { randomUUID } from 'crypto';
import { Tracing } from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import { LambdaToSqsToLambda } from '@aws-solutions-constructs/aws-lambda-sqs-lambda';
import { App, Stack, Duration } from '@aws-cdk/core';
import { SdkProvider } from 'aws-cdk/lib/api/aws-auth';
import { CloudFormationDeployments } from 'aws-cdk/lib/api/cloudformation-deployments';
import * as AWS from 'aws-sdk';

const lambdaClient = new AWS.Lambda();

const integTestApp = new App();
const stack = new Stack(integTestApp, 'ExampleIntegTest');

describe('sqs', () => {
  it('can be deploy succcessfully', async () => {
    // GIVEN
    const expectedNamespace = randomUUID(); // to easily find metrics back at assert phase
    const expectedServiceName = 'E2ETestsSQS';

    const producerFunctionName = 'E2ETestsSQProducer';
    const producerFunction = new lambda.NodejsFunction(stack, 'Producer', {
      functionName: producerFunctionName,
      tracing: Tracing.ACTIVE,
      environment: {
        EXPECTED_NAMESPACE: expectedNamespace,
        EXPECTED_SERVICE_NAME: expectedServiceName,
      },
      timeout: Duration.seconds(10),
    });
  
    const consumerRole = new iam.Role(stack, 'consumerRole', {
      roleName: 'SQSCOnsumerRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies:[
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess'), // DO NOT USE IN PROD
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXrayFullAccess'), // DO NOT USE IN PROD
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaExecute') // DO NOT USE IN PROD
      ]
    });
    const consumerFunctionName = 'E2ETestsSQSConsumer';
    const consumerFunction = new lambda.NodejsFunction(stack, 'Consumer', {
      functionName: consumerFunctionName,
      tracing: Tracing.DISABLED,
      environment: {
        EXPECTED_NAMESPACE: expectedNamespace,
        EXPECTED_SERVICE_NAME: expectedServiceName,
      },
      role: consumerRole,
      timeout: Duration.seconds(20),
    });

    new LambdaToSqsToLambda(stack, 'LambdaToSqsToLambdaPattern', {
      existingProducerLambdaObj: producerFunction,
      existingConsumerLambdaObj: consumerFunction,
    });

    const stackArtifact = integTestApp.synth().getStackByName(stack.stackName);

    const sdkProvider = await SdkProvider.withAwsCliCompatibleDefaults({
      profile: process.env.AWS_PROFILE,
    });
    const cloudFormation = new CloudFormationDeployments({ sdkProvider });

    // WHEN
    // lambda function is deployed
    await cloudFormation.deployStack({
      stack: stackArtifact,
    });
    // and invoked
    await lambdaClient
      .invoke({
        FunctionName: producerFunctionName,
      })
      .promise();
    // twice
    await lambdaClient
      .invoke({
        FunctionName: producerFunctionName,
      })
      .promise();

    // THEN
    expect(true).toBe(true);
  }, 9000000);
});

afterAll(async () => {
  if (!process.env.DISABLE_TEARDOWN) {
    const stackArtifact = integTestApp.synth().getStackByName(stack.stackName);

    const sdkProvider = await SdkProvider.withAwsCliCompatibleDefaults({
      profile: process.env.AWS_PROFILE,
    });
    const cloudFormation = new CloudFormationDeployments({ sdkProvider });

    await cloudFormation.destroyStack({
      stack: stackArtifact,
    });
  }
}, 9000000);
