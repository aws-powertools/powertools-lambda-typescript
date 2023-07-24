import type {
  NodejsFunctionOptions,
  DynamoDBTableOptions,
  SsmSecureStringOptions,
  SsmStringOptions,
} from './factories';

/**
 * Options to add a NodejsFunction to the test stack.
 */
type AddFunctionOptions = Omit<
  NodejsFunctionOptions,
  'stack' | 'resourceId' | 'runtime'
>;

/**
 * Options to add a DynamoDB table to the test stack.
 */
type AddDynamoDBTableOptions = Omit<
  DynamoDBTableOptions,
  'stack' | 'resourceId'
>;

/**
 * Options to add a SSM Secure String to the test stack.
 */
type AddSsmSecureStringOptions = Omit<
  SsmSecureStringOptions,
  'stack' | 'resourceId'
>;

/**
 * Options to add a SSM String to the test stack.
 */
type AddSsmStringOptions = Omit<SsmStringOptions, 'stack' | 'resourceId'>;

/**
 * Options to add a test case to the test stack.
 */
type AddTestCaseOptions = {
  testCaseName: string;
  function: AddFunctionOptions;
  dynamodb?: AddDynamoDBTableOptions;
  ssmSecureString?: AddSsmSecureStringOptions;
  ssmString?: AddSsmStringOptions;
};

export {
  AddFunctionOptions,
  AddDynamoDBTableOptions,
  AddTestCaseOptions,
  AddSsmSecureStringOptions,
  AddSsmStringOptions,
};
