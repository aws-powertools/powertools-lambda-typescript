import type { TestStack } from '@aws-lambda-powertools/testing-utils';
import type {
  ExtraTestProps,
  TestNodejsFunctionProps,
} from '@aws-lambda-powertools/testing-utils/types';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { commonEnvironmentVars } from '../e2e/constants.js';

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
