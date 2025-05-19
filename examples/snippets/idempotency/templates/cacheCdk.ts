import { Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { CfnServerlessCache } from 'aws-cdk-lib/aws-elasticache';
import {
  Architecture,
  Code,
  LayerVersion,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';

export class ValkeyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, 'MyVpc', {
      vpcId: 'vpc-{your_vpc_id}', // (1)!
    });

    const fnSecurityGroup = new SecurityGroup(this, 'ValkeyFnSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for Valkey function',
    });

    const idempotencyCacheSG = SecurityGroup.fromSecurityGroupId(
      this,
      'IdempotencyCacheSG',
      'security-{your_sg_id}' // (2)!
    );
    idempotencyCacheSG.addIngressRule(
      fnSecurityGroup,
      Port.tcp(6379),
      'Allow Lambda to connect to serverless cache'
    );

    const serverlessCache = new CfnServerlessCache(
      this,
      'MyCfnServerlessCache',
      {
        engine: 'valkey', // (3)!
        majorEngineVersion: '8',
        serverlessCacheName: 'idempotency-cache',
        subnetIds: [
          vpc.privateSubnets[0].subnetId,
          vpc.privateSubnets[1].subnetId,
        ],
        securityGroupIds: [idempotencyCacheSG.securityGroupId],
      }
    );

    const valkeyLayer = new LayerVersion(this, 'ValkeyLayer', {
      removalPolicy: RemovalPolicy.DESTROY,
      compatibleArchitectures: [Architecture.ARM_64],
      compatibleRuntimes: [Runtime.NODEJS_22_X],
      code: Code.fromAsset('./lib/layers/valkey-glide'),
    });

    const fnName = 'ValkeyFn';
    const logGroup = new LogGroup(this, 'MyLogGroup', {
      logGroupName: `/aws/lambda/${fnName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });
    const fn = new NodejsFunction(this, 'MyFunction', {
      functionName: fnName,
      logGroup,
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 512,
      timeout: Duration.seconds(30),
      entry: './src/idempotency.ts',
      handler: 'handler',
      layers: [valkeyLayer],
      bundling: {
        minify: true,
        mainFields: ['module', 'main'],
        sourceMap: true,
        format: OutputFormat.ESM,
        externalModules: ['@valkey/valkey-glide'],
        metafile: true,
        banner:
          "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
      },
      vpc,
      securityGroups: [fnSecurityGroup],
    });
    fn.addEnvironment(
      'CACHE_ENDPOINT',
      serverlessCache.getAtt('Endpoint.Address').toString()
    );
    fn.addEnvironment(
      'CACHE_PORT',
      serverlessCache.getAtt('Endpoint.Port').toString()
    );
  }
}
