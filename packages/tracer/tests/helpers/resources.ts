import { type TestStack } from '@aws-lambda-powertools/testing-utils';
import type {
  ExtraTestProps,
  TestNodejsFunctionProps,
} from '@aws-lambda-powertools/testing-utils/types';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { commonEnvironmentVars } from '../e2e/constants.js';

class TracerTestNodejsFunction extends TestNodejsFunction {
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
          EXPECTED_SERVICE_NAME: extraProps.nameSuffix,
          EXPECTED_CUSTOM_METADATA_VALUE: JSON.stringify(
            commonEnvironmentVars.EXPECTED_CUSTOM_METADATA_VALUE
          ),
          EXPECTED_CUSTOM_RESPONSE_VALUE: JSON.stringify(
            commonEnvironmentVars.EXPECTED_CUSTOM_RESPONSE_VALUE
          ),
          ...props.environment,
        },
      },
      extraProps
    );
  }
}

export { TracerTestNodejsFunction };
