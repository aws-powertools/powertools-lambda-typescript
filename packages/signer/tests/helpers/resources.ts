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
import { CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  AuthorizationType,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  BlockPublicAccess,
  Bucket,
  CfnMultiRegionAccessPoint,
  CfnMultiRegionAccessPointPolicy,
} from 'aws-cdk-lib/aws-s3';

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

/**
 * Creates a caller Lambda and private S3 resources for SigV4a E2E tests.
 *
 * A Multi-Region Access Point with one regional bucket verifies SigV4a against
 * S3's global endpoint while keeping the test deployable in one region.
 */
class SigV4aSignerTestFunction extends TestNodejsFunction {
  /**
   * Creates an access point and grants the caller access to its test objects.
   *
   * @param scope - The test stack that owns all resources.
   * @param props - The caller Lambda configuration.
   * @param extraProps - The test function naming and output options.
   */
  public constructor(
    scope: TestStack,
    props: TestNodejsFunctionProps,
    extraProps: ExtraTestProps
  ) {
    super(scope, props, extraProps);

    this.logGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);
    const bucket = new Bucket(scope.stack, 'SigV4aBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const accessPoint = new CfnMultiRegionAccessPoint(
      scope.stack,
      'AccessPoint',
      {
        name: scope.testName.toLowerCase(),
        regions: [{ bucket: bucket.bucketName }],
        publicAccessBlockConfiguration: {
          blockPublicAcls: true,
          ignorePublicAcls: true,
          blockPublicPolicy: true,
          restrictPublicBuckets: true,
        },
      }
    );
    const stack = Stack.of(scope.stack);
    const objectArn = `arn:${stack.partition}:s3::${stack.account}:accesspoint/${accessPoint.attrAlias}/object/*`;
    const actions = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'];
    new CfnMultiRegionAccessPointPolicy(scope.stack, 'AccessPointPolicy', {
      mrapName: accessPoint.ref,
      policy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions,
            resources: [objectArn],
            principals: [this.grantPrincipal],
          }),
        ],
      }).toJSON(),
    });
    bucket.grantReadWrite(this);
    this.addToRolePolicy(
      new PolicyStatement({ actions, resources: [objectArn] })
    );
    this.addEnvironment(
      'TARGET_MRAP_URL',
      `https://${accessPoint.attrAlias}.accesspoint.s3-global.${stack.urlSuffix}`
    );
  }
}

export { SignerTestFunction, SigV4aSignerTestFunction };
