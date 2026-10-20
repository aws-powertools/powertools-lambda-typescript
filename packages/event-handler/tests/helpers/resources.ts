import type { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import type {
  ExtraTestProps,
  TestNodejsFunctionProps,
} from '@aws-lambda-powertools/testing-utils/types';
import { RestApiTestConstruct } from './RestApiTestConstruct.js';

/**
 * Creates a Lambda function with API Gateway REST API integration for e2e tests.
 *
 * This class extends {@link TestNodejsFunction | `TestNodejsFunction`} and automatically
 * creates a REST API Gateway with proxy integration, making it easy to test
 * REST event handlers end-to-end.
 *
 * @example
 * ```typescript
 * const testFunction = new RestApiTestFunction(
 *   testStack,
 *   { entry: './handler.ts' },
 *   { nameSuffix: 'MyRestApi' }
 * );
 * const apiUrl = testFunction.apiUrl;
 * ```
 */
class RestApiTestFunction extends TestNodejsFunction {
  public readonly apiConstruct: RestApiTestConstruct;
  public readonly apiUrl: string;

  public constructor(
    scope: TestStack,
    props: TestNodejsFunctionProps,
    extraProps: ExtraTestProps
  ) {
    super(scope, props, extraProps);

    // Create API Gateway REST API with proxy integration
    this.apiConstruct = new RestApiTestConstruct(scope, this, extraProps);

    this.apiUrl = this.apiConstruct.apiUrl;
  }
}

export { RestApiTestFunction };
