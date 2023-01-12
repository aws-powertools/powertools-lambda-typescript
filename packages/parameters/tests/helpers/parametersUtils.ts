import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Table, TableProps, BillingMode } from 'aws-cdk-lib/aws-dynamodb';

export type CreateDynamoDBTableOptions = {
  stack: Stack
  id: string
} & TableProps;

const createDynamoDBTable = (options: CreateDynamoDBTableOptions): Table => {
  const { stack, id, ...tableProps } = options;
  const props = {
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
    ...tableProps,
  };

  return new Table(stack, id, props);
};

export {
  createDynamoDBTable
};