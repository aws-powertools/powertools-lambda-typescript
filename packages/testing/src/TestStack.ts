import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AwsCdkCli, RequireApproval } from '@aws-cdk/cli-lib-alpha';
import type { ICloudAssemblyDirectoryProducer } from '@aws-cdk/cli-lib-alpha';
import { App, Stack } from 'aws-cdk-lib';
import { generateTestUniqueName } from './helpers.js';
import type { TestStackProps } from './types.js';

/**
 * Test stack that can be deployed to the selected environment.
 */
class TestStack implements ICloudAssemblyDirectoryProducer {
  /**
   * Reference to the AWS CDK App object.
   * @default new App()
   */
  public app: App;
  /**
   * Outputs of the deployed stack.
   */
  public outputs: Record<string, string> = {};
  /**
   * Reference to the AWS CDK Stack object.
   * @default new Stack(this.app, stackName)
   */
  public stack: Stack;
  /**
   * Name of the test stack.
   * @example
   * Logger-E2E-node18-12345-someFeature
   */
  public testName: string;

  /**
   * @internal
   * Reference to the AWS CDK CLI object.
   */
  #cli: AwsCdkCli;

  public constructor({ stackNameProps, app, stack }: TestStackProps) {
    this.testName = generateTestUniqueName({
      testName: stackNameProps.testName,
      testPrefix: stackNameProps.stackNamePrefix,
    });
    this.app = app ?? new App();
    this.stack = stack ?? new Stack(this.app, this.testName);
    this.#cli = AwsCdkCli.fromCloudAssemblyDirectoryProducer(this);
  }

  /**
   * Deploy the test stack to the selected environment.
   *
   * It returns the outputs of the deployed stack.
   */
  public async deploy(): Promise<Record<string, string>> {
    const outputFilePath = join(
      tmpdir(),
      'powertools-e2e-testing',
      `${this.stack.stackName}.outputs.json`
    );
    await this.#cli.deploy({
      stacks: [this.stack.stackName],
      requireApproval: RequireApproval.NEVER,
      outputsFile: outputFilePath,
    });

    this.outputs = JSON.parse(await readFile(outputFilePath, 'utf-8'))[
      this.stack.stackName
    ];

    return this.outputs;
  }

  /**
   * Destroy the test stack.
   */
  public async destroy(): Promise<void> {
    await this.#cli.destroy({
      stacks: [this.stack.stackName],
      requireApproval: false,
    });
  }

  /**
   * Find and get the value of a StackOutput by its key.
   */
  public findAndGetStackOutputValue = (key: string): string => {
    const value = Object.keys(this.outputs).find((outputKey) =>
      outputKey.includes(key)
    );
    if (!value) {
      throw new Error(`Cannot find output for ${key}`);
    }

    return this.outputs[value];
  };

  /**
   * Produce the Cloud Assembly directory.
   */
  public async produce(_context: Record<string, unknown>): Promise<string> {
    return this.app.synth().directory;
  }

  /**
   * Synthesize the test stack.
   */
  public async synth(): Promise<void> {
    await this.#cli.synth({
      stacks: [this.stack.stackName],
    });
  }
}

export { TestStack };
