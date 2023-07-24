import type { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Table } from 'aws-cdk-lib/aws-dynamodb';
import type { IStringParameter, StringParameter } from 'aws-cdk-lib/aws-ssm';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

class NodeJsFunction {
  public functionName: string;
  public ref: NodejsFunction;

  public constructor(name: string, ref: NodejsFunction) {
    this.functionName = name;
    this.ref = ref;
  }
}

class DynamoDBTable {
  public ref: Table;
  public tableName: string;
  readonly #envVariableName?: string;

  public constructor(name: string, ref: Table, envVariableName?: string) {
    this.tableName = name;
    this.ref = ref;
    this.#envVariableName = envVariableName;
  }

  public get envVariableName(): string {
    return this.#envVariableName ?? 'TABLE_NAME';
  }
}

abstract class SSMResource {
  public parameterName: string;
  public ref: StringParameter | IStringParameter;
  protected readonly envVarName?: string;

  public constructor(
    name: string,
    ref: StringParameter | IStringParameter,
    envVariableName?: string
  ) {
    this.parameterName = name;
    this.ref = ref;
    this.envVarName = envVariableName;
  }
}

class SsmSecureString extends SSMResource {
  public constructor(
    name: string,
    ref: IStringParameter,
    envVariableName?: string
  ) {
    super(name, ref, envVariableName);
  }

  public get envVariableName(): string {
    return this.envVarName ?? 'SECURE_STRING_NAME';
  }
}

class SsmString extends SSMResource {
  public constructor(
    name: string,
    ref: StringParameter,
    envVariableName?: string
  ) {
    super(name, ref, envVariableName);
  }

  public get envVariableName(): string {
    return this.envVarName ?? 'SSM_STRING_NAME';
  }
}

/**
 * A test case that can be added to a test stack.
 */
class TestCase {
  public testName: string;
  #dynamodb?: DynamoDBTable;
  #function?: NodeJsFunction;
  #ssmSecureString?: SsmSecureString;
  #ssmString?: SsmString;

  public constructor(testName: string) {
    this.testName = testName;
  }

  /**
   * The NodejsFunction that is associated with this test case.
   */
  public set function(fn: NodeJsFunction) {
    if (this.#dynamodb) {
      this.#grantAccessToDynamoDBTableAndSetEnv(fn, this.#dynamodb);
    }
    if (this.#ssmSecureString) {
      this.#grantAccessToSsmeStringAndSetEnv(fn, this.#ssmSecureString);
    }
    if (this.#ssmString) {
      this.#grantAccessToSsmeStringAndSetEnv(fn, this.#ssmString);
    }
    this.#function = fn;
  }

  /**
   * Get the NodejsFunction that is associated with this test case.
   */
  public get function(): NodeJsFunction {
    if (!this.#function) throw new Error('This test case has no function.');

    return this.#function;
  }

  /**
   * The DynamoDB table that is associated with this test case.
   */
  public set dynamodb(table: DynamoDBTable) {
    if (this.#function) {
      this.#grantAccessToDynamoDBTableAndSetEnv(this.#function, table);
    }
    this.#dynamodb = table;
  }

  /**
   * Get the DynamoDB table that is associated with this test case.
   */
  public get dynamodb(): DynamoDBTable {
    if (!this.#dynamodb)
      throw new Error('This test case has no DynamoDB table.');

    return this.#dynamodb;
  }

  /**
   * Grant access to the DynamoDB table and set the environment variable to
   * the table name.
   *
   * @param fn - The function to grant access to the table and set the environment variable.
   * @param table - The table to grant access to and identified by the environment variable.
   */
  #grantAccessToDynamoDBTableAndSetEnv = (
    fn: NodeJsFunction,
    table: DynamoDBTable
  ): void => {
    table.ref.grantReadWriteData(fn.ref);
    fn.ref.addEnvironment(table.envVariableName, table.ref.tableName);
  };

  /**
   * The SSM SecureString that is associated with this test case.
   */
  public set ssmSecureString(parameter: SsmSecureString) {
    if (this.#function) {
      this.#grantAccessToSsmeStringAndSetEnv(this.#function, parameter);
    }
    this.#ssmSecureString = parameter;
  }

  /**
   * Get the SSM SecureString that is associated with this test case.
   */
  public get ssmSecureString(): SsmSecureString {
    if (!this.#ssmSecureString)
      throw new Error('This test case has no SSM SecureString.');

    return this.#ssmSecureString;
  }

  /**
   * The SSM String that is associated with this test case.
   */
  public set ssmString(parameter: SsmString) {
    if (this.#function) {
      this.#grantAccessToSsmeStringAndSetEnv(this.#function, parameter);
    }
    this.#ssmString = parameter;
  }

  /**
   * Get the SSM String that is associated with this test case.
   */
  public get ssmString(): SsmString {
    if (!this.#ssmString) throw new Error('This test case has no SSM String.');

    return this.#ssmString;
  }

  /**
   * Grant access to the SSM String and set the environment variable to
   * the parameter name.
   *
   * @param fn - The function to grant access to the parameter and set the environment variable.
   * @param parameter - The parameter to grant access to and identified by the environment variable.
   */
  #grantAccessToSsmeStringAndSetEnv = (
    fn: NodeJsFunction,
    parameter: SsmSecureString | SsmString
  ): void => {
    fn.ref.addEnvironment(parameter.envVariableName, parameter.parameterName);
    // Grant access also to the path of the parameter
    fn.ref.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:GetParametersByPath'],
        resources: [
          parameter.ref.parameterArn.split(':').slice(0, -1).join(':'),
        ],
      })
    );
    parameter.ref.grantRead(fn.ref);
  };
}

export { TestCase, NodeJsFunction, DynamoDBTable, SsmSecureString, SsmString };
