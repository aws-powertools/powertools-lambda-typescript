import type { TableProps, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import type { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

interface ExtraTestProps {
  /**
   * The suffix to be added to the resource name.
   *
   * For example, if the resource name is `fn-12345` and the suffix is `BasicFeatures`,
   * the output will be `fn-12345-BasicFeatures`.
   *
   * Note that the maximum length of the name is 64 characters, so the suffix might be truncated.
   */
  nameSuffix: string;
}

type TestDynamodbTableProps = Omit<
  TableProps,
  'removalPolicy' | 'tableName' | 'billingMode' | 'partitionKey'
> & {
  partitionKey?: {
    name: string;
    type: AttributeType;
  };
};

type TestNodejsFunctionProps = Omit<
  NodejsFunctionProps,
  'logRetention' | 'runtime' | 'functionName'
>;

export { ExtraTestProps, TestDynamodbTableProps, TestNodejsFunctionProps };
