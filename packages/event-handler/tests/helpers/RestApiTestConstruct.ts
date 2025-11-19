import { randomUUID } from 'node:crypto';
import {
  concatenateResourceName,
  type TestStack,
} from '@aws-lambda-powertools/testing-utils';
import type { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import type { ExtraTestProps } from '@aws-lambda-powertools/testing-utils/types';
import { CfnOutput } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

/**
 * Creates a REST API Gateway with proxy integration to a Lambda function.
 *
 * This construct is designed for end-to-end testing of REST API handlers.
 * It creates a catch-all proxy resource that forwards all requests to the
 * Lambda function, allowing the function to handle routing internally.
 *
 * @example
 * ```typescript
 * const testFunction = new TestNodejsFunction(testStack, props, extraProps);
 * const apiConstruct = new RestApiTestConstruct(
 *   testStack,
 *   testFunction,
 *   { nameSuffix: 'MyApi' }
 * );
 * const apiUrl = apiConstruct.apiUrl;
 * ```
 */
class RestApiTestConstruct extends Construct {
  public readonly api: RestApi;
  public readonly apiUrl: string;

  public constructor(
    testStack: TestStack,
    lambda: TestNodejsFunction,
    extraProps: ExtraTestProps
  ) {
    super(
      testStack.stack,
      concatenateResourceName({
        testName: testStack.testName,
        resourceName: randomUUID(),
      })
    );

    this.api = new RestApi(
      this,
      concatenateResourceName({
        testName: testStack.testName,
        resourceName: 'RestApi',
      }),
      {
        restApiName: concatenateResourceName({
          testName: testStack.testName,
          resourceName: extraProps.nameSuffix,
        }),
        deployOptions: {
          stageName: 'test',
        },
      }
    );

    // Create Lambda integration
    const integration = new LambdaIntegration(lambda);

    // Add catch-all proxy resource for all routes
    const proxyResource = this.api.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', integration);

    // Handle root path
    this.api.root.addMethod('ANY', integration);

    this.apiUrl = this.api.url;

    // Output API URL for test retrieval
    new CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
    });
  }
}

export { RestApiTestConstruct };
