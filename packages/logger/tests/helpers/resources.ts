import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils';
import type { TestStack } from '@aws-lambda-powertools/testing-utils';
import { CfnOutput } from 'aws-cdk-lib';
import type {
  TestNodejsFunctionProps,
  ExtraTestProps,
} from '@aws-lambda-powertools/testing-utils';
import { commonEnvironmentVars } from '../e2e/constants';

interface LoggerExtraTestProps extends ExtraTestProps {
  logGroupOutputKey?: string;
}

class LoggerTestNodejsFunction extends TestNodejsFunction {
  public constructor(
    scope: TestStack,
    props: TestNodejsFunctionProps,
    extraProps: LoggerExtraTestProps
  ) {
    super(
      scope,
      {
        ...props,
        environment: {
          ...commonEnvironmentVars,
          ...props.environment,
        },
      },
      extraProps
    );

    if (extraProps.logGroupOutputKey) {
      new CfnOutput(this, extraProps.logGroupOutputKey, {
        value: this.logGroup.logGroupName,
      });
    }
  }
}

export { LoggerTestNodejsFunction };
