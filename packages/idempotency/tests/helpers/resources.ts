import type {
  ExtraTestProps,
  TestDynamodbTableProps,
  TestNodejsFunctionProps,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import {
  concatenateResourceName,
  TestDynamodbTable,
  TestNodejsFunction,
} from '@aws-lambda-powertools/testing-utils';
import { Construct } from 'constructs';
import { randomUUID } from 'node:crypto';

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
