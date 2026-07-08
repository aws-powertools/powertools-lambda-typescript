import { randomUUID } from 'node:crypto';
import {
  concatenateResourceName,
  type TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import type {
  ExtraTestProps,
  TestNodejsFunctionProps,
} from '@aws-lambda-powertools/testing-utils/types';
import { CfnOutput } from 'aws-cdk-lib';
import {
  AuthorizationType,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * Creates a caller Lambda function plus an IAM-protected REST API for signer
 * e2e tests.
 *
 * The API exposes an `/items` resource with `GET` and `POST` methods, both
 * requiring IAM (SigV4) authorization. The methods use a **mock integration**
 * that returns a static `200` response, so no backing Lambda is needed — the
 * authorization decision happens at the API Gateway method level, which is all
 * the signer needs to be validated against (unsigned → 403, signed → 200).
 *
 * The caller function's execution role is granted `execute-api:Invoke` on both
 * methods, and the API URL is injected as `TARGET_API_URL`.
 */
class SignerTestFunction extends TestNodejsFunction {
  public readonly api: RestApi;
  public readonly apiUrl: string;

  public constructor(
    scope: TestStack,
    props: TestNodejsFunctionProps,
    extraProps: ExtraTestProps
  ) {
    super(scope, props, extraProps);

    this.api = new RestApi(
      scope.stack,
      concatenateResourceName({
        testName: scope.testName,
        resourceName: 'RestApi',
      }),
      {
        restApiName: concatenateResourceName({
          testName: scope.testName,
          resourceName: extraProps.nameSuffix,
        }),
        deployOptions: { stageName: 'test' },
      }
    );

    // Mock integration that returns a static 200 with a small JSON body.
    const integration = new MockIntegration({
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: {
            'application/json': '{"ok": true}',
          },
        },
      ],
    });
    const methodOptions = {
      authorizationType: AuthorizationType.IAM,
      methodResponses: [{ statusCode: '200' }],
    };

    const items = this.api.root.addResource('items');
    items.addMethod('GET', integration, methodOptions);
    items.addMethod('POST', integration, methodOptions);

    // Allow the caller's execution role to invoke the IAM-protected methods.
    this.addToRolePolicy(
      new PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          this.api.arnForExecuteApi('GET', '/items', 'test'),
          this.api.arnForExecuteApi('POST', '/items', 'test'),
        ],
      })
    );

    this.apiUrl = this.api.url;
    this.addEnvironment('TARGET_API_URL', this.apiUrl);

    new CfnOutput(scope.stack, `api-${randomUUID().substring(0, 5)}`, {
      value: this.apiUrl,
    });
  }
}

export { SignerTestFunction };
