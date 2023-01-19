import { Stack, RemovalPolicy, CustomResource, Duration } from 'aws-cdk-lib';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StringParameter, IStringParameter } from 'aws-cdk-lib/aws-ssm';
import { Table, TableProps, BillingMode } from 'aws-cdk-lib/aws-dynamodb';

export type CreateDynamoDBTableOptions = {
  stack: Stack
  id: string
} & TableProps;

const createDynamoDBTable = (options: CreateDynamoDBTableOptions): Table => {
  const { stack, id, ...tableProps } = options;
  const props = {
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
    ...tableProps,
  };

  return new Table(stack, id, props);
};

export type CreateSecureStringProviderOptions = {
  stack: Stack
  parametersPrefix: string
};

const createSecureStringProvider = (options: CreateSecureStringProviderOptions): Provider => {
  const { stack, parametersPrefix } = options;

  const ssmSecureStringHandlerFn = new NodejsFunction(
    stack,
    'ssm-securestring-handler',
    {
      entry: 'tests/helpers/ssmSecureStringCdk.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: [],
      },
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(15),
    });
  ssmSecureStringHandlerFn.addToRolePolicy(
    new PolicyStatement({
      actions: [
        'ssm:PutParameter',
        'ssm:DeleteParameter',
      ],
      resources: [
        `arn:aws:ssm:${stack.region}:${stack.account}:parameter/${parametersPrefix}*`,
      ],
    }),
  );

  return new Provider(stack, 'ssm-secure-string-provider', {
    onEventHandler: ssmSecureStringHandlerFn,
    logRetention: RetentionDays.ONE_DAY,
  });
};

export type CreateSSMSecureStringOptions = {
  stack: Stack
  provider: Provider
  id: string
  name: string
  value: string
};

const createSSMSecureString = (options: CreateSSMSecureStringOptions): IStringParameter => {
  const { stack, provider, id, name, value } = options;

  new CustomResource(stack, `custom-${id}`, {
    serviceToken: provider.serviceToken,
    properties: {
      Name: name,
      Value: value,
    },
  });

  const param = StringParameter.fromSecureStringParameterAttributes(stack, id, {
    parameterName: name,
  });
  param.node.addDependency(provider);

  return param;
};

export {
  createDynamoDBTable,
  createSSMSecureString,
  createSecureStringProvider,
};