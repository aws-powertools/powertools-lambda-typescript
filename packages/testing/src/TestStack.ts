import { Console } from 'node:console';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type ICloudAssemblySource,
  StackSelectionStrategy,
  Toolkit,
} from '@aws-cdk/toolkit-lib';
import { App, Stack } from 'aws-cdk-lib';
import { generateTestUniqueName } from './helpers.js';
import type { TestStackProps } from './types.js';

const testConsole = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
});

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
  readonly #cli: Toolkit;
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
    this.stack =
      stack ??
      new Stack(this.app, this.testName, {
        tags: {
          Service: 'Powertools-for-AWS-e2e-tests',
        },
      });
    let lastCreateLog = 0;
    let lastDestroyLog = 0;
    const creationDeleteLogFrequency = 10000; // 10 seconds
    const that = this;
    this.#cli = new Toolkit({
      color: false,
      ioHost: {
        /**
         * Log messages to the console depending on the log level.
         *
         * If the `RUNNER_DEBUG` environment variable is set to `1`, all messages are logged.
         *
         * Otherwise, we log messages that are either warnings or errors as well as periodic
         * updates on the stack creation and destruction process.
         *
         * @param msg - Message to log sent by the CDK CLI
         */
        async notify(msg) {
          if (process.env.RUNNER_DEBUG === '1') {
            testConsole.log(msg);
            return;
          }
          if (msg.message.includes('destroyed') && msg.message.includes('✅')) {
            testConsole.log(msg.message);
            return;
          }
          if (msg.message.includes('✅') && !msg.message.includes('deployed')) {
            testConsole.log(`${that.testName} deployed successfully`);
            return;
          }
          if (msg.message.includes('CREATE_IN_PROGRESS')) {
            if (Date.now() - lastCreateLog < creationDeleteLogFrequency) {
              return;
            }
            lastCreateLog = Date.now();
            testConsole.log(`${that.testName} stack is being created...`);
            return;
          }
          if (msg.message.includes('DELETE_IN_PROGRESS')) {
            if (Date.now() - lastDestroyLog < creationDeleteLogFrequency) {
              return;
            }
            lastDestroyLog = Date.now();
            testConsole.log(`${that.testName} stack is being destroyed...`);
            return;
          }
          if (['warning', 'error'].includes(msg.level)) {
            testConsole.log(msg);
          }
        },
        async requestResponse(msg) {
          if (
            process.env.RUNNER_DEBUG === '1' ||
            ['warning', 'error'].includes(msg.level)
          ) {
            testConsole.log(msg);
          }
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
