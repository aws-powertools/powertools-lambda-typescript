import type {
  ExtraTestProps,
  TestNodejsFunctionProps,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils';
import { commonEnvironmentVars } from '../e2e/constants';

class MetricsTestNodejsFunction extends TestNodejsFunction {
  public constructor(
    scope: TestStack,
    props: TestNodejsFunctionProps,
    extraProps: ExtraTestProps
  ) {
    super(
      scope,
      {
        ...props,
        environment: {
          ...commonEnvironmentVars,
          EXPECTED_DEFAULT_DIMENSIONS: JSON.stringify(
            commonEnvironmentVars.EXPECTED_DEFAULT_DIMENSIONS
          ),
          EXPECTED_EXTRA_DIMENSION: JSON.stringify(
            commonEnvironmentVars.EXPECTED_EXTRA_DIMENSION
          ),
          EXPECTED_SINGLE_METRIC_DIMENSION: JSON.stringify(
            commonEnvironmentVars.EXPECTED_SINGLE_METRIC_DIMENSION
          ),
          ...props.environment,
        },
      },
      extraProps
    );
  }
}

export { MetricsTestNodejsFunction };
