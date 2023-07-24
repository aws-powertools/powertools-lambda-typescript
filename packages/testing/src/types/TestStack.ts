import type {
  NodejsFunctionOptions,
  DynamoDBTableOptions,
  SsmSecureStringOptions,
  SsmStringOptions,
} from './factories';

type AddFunctionOptions = Omit<
  NodejsFunctionOptions,
  'stack' | 'resourceId' | 'runtime'
>;

type AddDynamoDBTableOptions = Omit<
  DynamoDBTableOptions,
  'stack' | 'resourceId'
>;

type AddSsmSecureStringOptions = Omit<
  SsmSecureStringOptions,
  'stack' | 'resourceId'
>;

type AddSsmStringOptions = Omit<SsmStringOptions, 'stack' | 'resourceId'>;

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
