import { randomUUID } from 'node:crypto';
import {
  concatenateResourceName,
  type TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { TestDynamodbTable } from '@aws-lambda-powertools/testing-utils/resources/dynamodb';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import type {
  ExtraTestProps,
  TestDynamodbTableProps,
  TestNodejsFunctionProps,
} from '@aws-lambda-powertools/testing-utils/types';
import { Construct } from 'constructs';

class IdempotencyTestNodejsFunctionAndDynamoTable extends Construct {
  public constructor(
    testStack: TestStack,
    props: {
      function: TestNodejsFunctionProps;
      table?: TestDynamodbTableProps;
    },
    extraProps: ExtraTestProps
  ) {
    super(
      testStack.stack,
      concatenateResourceName({
        testName: testStack.testName,
        resourceName: randomUUID(),
      })
    );

    const table = new TestDynamodbTable(testStack, props.table || {}, {
      nameSuffix: `${extraProps.nameSuffix}Table`,
    });

    const fn = new TestNodejsFunction(
      testStack,
      {
        ...props.function,
        environment: {
          IDEMPOTENCY_TABLE_NAME: table.tableName,
          POWERTOOLS_LOGGER_LOG_EVENT: 'true',
        },
      },
      {
        nameSuffix: `${extraProps.nameSuffix}Fn`,
      }
    );

    table.grantReadWriteData(fn);
  }
}

export { IdempotencyTestNodejsFunctionAndDynamoTable };
