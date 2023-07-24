import { App, Stack } from 'aws-cdk-lib';
import { AwsCdkCli, RequireApproval } from '@aws-cdk/cli-lib-alpha';
import { randomUUID } from 'node:crypto';
import type { ICloudAssemblyDirectoryProducer } from '@aws-cdk/cli-lib-alpha';
import {
  dynamoDBTable,
  dynamoDBItem,
  nodejsFunction,
  ssmSecureString,
  ssmString,
} from './factories';
import { TEST_RUNTIMES, defaultRuntime } from './constants';
import {
  NodeJsFunction,
  DynamoDBTable,
  SsmSecureString,
  TestCase,
  SsmString,
} from './TestCase';
import type {
  AddFunctionOptions,
  AddDynamoDBTableOptions,
  AddTestCaseOptions,
  AddSsmSecureStringOptions,
  AddSsmStringOptions,
} from './types';

class TestStack implements ICloudAssemblyDirectoryProducer {
  public app: App;
  public cli: AwsCdkCli;
  public stack: Stack;
  readonly #resourceNamePrefix;
  readonly #runtime: keyof typeof TEST_RUNTIMES;
  readonly #testCases = new Map<string, TestCase>();

  public constructor(resourceNamePrefix: string, testName: string) {
    this.#resourceNamePrefix = resourceNamePrefix;
    const providedRuntime = process.env.RUNTIME || defaultRuntime;
    if (!(providedRuntime in TEST_RUNTIMES)) {
      throw new Error(
        `Invalid runtime: ${providedRuntime}. Valid runtimes are: ${Object.keys(
          TEST_RUNTIMES
        ).join(', ')}`
      );
    }
    this.#runtime = providedRuntime as keyof typeof TEST_RUNTIMES;
    this.app = new App();
    this.stack = new Stack(this.app, this.#generateUniqueName(testName));
    this.cli = AwsCdkCli.fromCloudAssemblyDirectoryProducer(this);
  }

  /**
   * Add a DynamoDB table to the test stack.
   *
   * @returns A reference to the DynamoDB table that was added to the stack.
   */
  #addDynamoDBTable = (
    testCaseName: string,
    options: AddDynamoDBTableOptions
  ): DynamoDBTable => {
    const resourceId = this.#generateUniqueName(`${testCaseName}-table`);
    const name = options.name ?? resourceId;
    const table = dynamoDBTable({
      ...options,
      stack: this.stack,
      resourceId,
      name,
    });

    return new DynamoDBTable(name, table, options.envVariableName);
  };

  /**
   * Add a NodejsFunction to the test stack.
   *
   * @returns A reference to the NodejsFunction that was added to the stack.
   */
  #addFunction = (
    testCaseName: string,
    options: AddFunctionOptions
  ): NodeJsFunction => {
    const resourceId = this.#generateUniqueName(`${testCaseName}-fn`);
    const name = options.functionConfigs?.name ?? resourceId;
    const fn = nodejsFunction({
      stack: this.stack,
      resourceId,
      runtime: this.#runtime,
      functionConfigs: {
        ...options.functionConfigs,
        name,
      },
      functionCode: options.functionCode,
    });

    return new NodeJsFunction(name, fn);
  };

  /**
   * Add a SSM SecureString to the test stack.
   */
  #addSsmSecureString = (
    testCaseName: string,
    options: AddSsmSecureStringOptions
  ): SsmSecureString => {
    const resourceId = this.#generateUniqueName(`${testCaseName}-ssmSecure`);
    const name = options.name ?? resourceId;
    const ssmSecure = ssmSecureString({
      stack: this.stack,
      resourceId,
      name,
      value: options.value,
    });

    return new SsmSecureString(name, ssmSecure, options.envVariableName);
  };

  /**
   * Add a SSM String to the test stack.
   */
  #addSsmString = (
    testCaseName: string,
    options: AddSsmStringOptions
  ): SsmString => {
    const resourceId = this.#generateUniqueName(`${testCaseName}-ssmString`);
    const name = options.name ?? resourceId;
    const ssm = ssmString({
      stack: this.stack,
      resourceId,
      name,
      value: options.value,
    });

    return new SsmString(name, ssm, options.envVariableName);
  };

  /**
   * Create a TestCase and add it to the test stack.
   *
   * @param options - The options for creating a TestCase.
   */
  public addTestCase = (options: AddTestCaseOptions): void => {
    if (this.#testCases.has(options.testCaseName)) {
      throw new Error(
        `A test case with the name ${options.testCaseName} already exists.`
      );
    }
    // Initialize the test case
    const test = new TestCase(options.testCaseName);
    // Add the function to the test case
    const fn = this.#addFunction(options.testCaseName, options.function);
    test.function = fn;
    // If the test case has a DynamoDB table, add it
    if (options?.dynamodb) {
      const table = this.#addDynamoDBTable(
        options.testCaseName,
        options.dynamodb
      );
      // If the test case has items, add them to the table
      if (options.dynamodb?.items) {
        options.dynamodb.items.forEach((item, index) => {
          dynamoDBItem({
            stack: this.stack,
            resourceId: this.#generateUniqueName(
              `${options.testCaseName}-item${index}`
            ),
            tableName: table.tableName,
            tableArn: table.ref.tableArn,
            item,
          });
        });
      }
      // Save a reference to the table in the test case
      test.dynamodb = table;
    }
    // If the test case has a SSM SecureString, add it
    if (options?.ssmSecureString) {
      const ssmSecureString = this.#addSsmSecureString(
        options.testCaseName,
        options.ssmSecureString
      );
      // Save a reference to the SSM SecureString in the test case
      test.ssmSecureString = ssmSecureString;
    }
    // If the test case has a SSM String, add it
    if (options?.ssmString) {
      const ssmString = this.#addSsmString(
        options.testCaseName,
        options.ssmString
      );
      // Save a reference to the SSM String in the test case
      test.ssmString = ssmString;
    }

    this.#testCases.set(options.testCaseName, test);
  };

  /**
   * Deploy the test stack to the selected environment.
   */
  public async deploy(): Promise<void> {
    await this.cli.deploy({
      stacks: [this.stack.stackName],
      requireApproval: RequireApproval.NEVER,
    });
  }

  /**
   * Destroy the test stack.
   */
  public async destroy(): Promise<void> {
    await this.cli.destroy({
      stacks: [this.stack.stackName],
      requireApproval: false,
    });
  }

  /**
   * Get a test case from the test stack.
   *
   * If no test case with the provided name exists, an error is thrown.
   *
   * @param testCaseName - The name of the test case to get.
   */
  public getTestCase = (testCaseName: string): TestCase => {
    const testCase = this.#testCases.get(testCaseName);
    if (!testCase) {
      throw new Error(`No test case with name ${testCaseName} exists.`);
    }

    return testCase;
  };

  public async produce(_context: Record<string, unknown>): Promise<string> {
    return this.app.synth().directory;
  }

  public async synth(): Promise<void> {
    await this.cli.synth({
      stacks: [this.stack.stackName],
    });
  }

  #generateUniqueName = (resourceName: string): string => {
    const uuid = randomUUID();

    return `${this.#resourceNamePrefix}-${this.#runtime}-${uuid.substring(
      0,
      5
    )}-${resourceName}`.substring(0, 64);
  };
}

export { TestStack };
