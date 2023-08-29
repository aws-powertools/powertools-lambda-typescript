import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import type { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';

interface ExtraTestProps {
  logGroupOutputKey?: string;
}

/**
 * A NodejsFunction that can be used in tests.
 *
 * It includes some default props and can optionally output the log group name.
 */
class TestNodejsFunction extends NodejsFunction {
  public constructor(
    scope: Construct,
    id: string,
    props: NodejsFunctionProps,
    extraProps: ExtraTestProps = {}
  ) {
    super(scope, id, {
      timeout: Duration.seconds(30),
      memorySize: 256,
      tracing: Tracing.ACTIVE,
      ...props,
      logRetention: RetentionDays.ONE_DAY,
    });

    if (extraProps.logGroupOutputKey) {
      new CfnOutput(this, extraProps.logGroupOutputKey, {
        value: this.logGroup.logGroupName,
      });
    }
  }
}

export { TestNodejsFunction };
