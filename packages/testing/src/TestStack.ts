import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type ICloudAssemblySource,
  RequireApproval,
  StackSelectionStrategy,
  Toolkit,
} from '@aws-cdk/toolkit-lib';
import { App, Stack } from 'aws-cdk-lib';
import { generateTestUniqueName } from './helpers.js';
import type { TestStackProps } from './types.js';

/**
 * Test stack that can be deployed to the selected environment.
 */
class TestStack {
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
  #cli: Toolkit;
  /**
   * @internal
   * Reference to the AWS CDK Cloud Assembly context.
   */
  #cx?: ICloudAssemblySource;

  public constructor({ stackNameProps, app, stack }: TestStackProps) {
    this.testName = generateTestUniqueName({
      testName: stackNameProps.testName,
      testPrefix: stackNameProps.stackNamePrefix,
    });
    this.app = app ?? new App();
    this.stack = stack ?? new Stack(this.app, this.testName);
    this.#cli = new Toolkit({
      color: false,
      ioHost: {
        async notify(msg) {
          console.log(msg);
        },
        async requestResponse(msg) {
          console.log(msg);
          return msg.defaultResponse;
        },
      },
    });
  }

  /**
   * Deploy the test stack to the selected environment.
   *
   * It returns the outputs of the deployed stack.
   */
  public async deploy(): Promise<Record<string, string>> {
    const outdir = join(tmpdir(), 'powertools-e2e-testing');
    const outputFilePath = join(outdir, `${this.stack.stackName}.outputs.json`);
    this.#cx = await this.#cli.fromAssemblyBuilder(
      async () => this.app.synth(),
      {
        outdir,
      }
    );
    await this.#cli.deploy(this.#cx, {
      stacks: {
        strategy: StackSelectionStrategy.ALL_STACKS,
      },
      outputsFile: outputFilePath,
      requireApproval: RequireApproval.NEVER,
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
    if (!this.#cx) {
      throw new Error('Cannot destroy stack without a Cloud Assembly');
    }
    await this.#cli.destroy(this.#cx, {
      stacks: {
        strategy: StackSelectionStrategy.ALL_STACKS,
      },
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
}

export { TestStack };
