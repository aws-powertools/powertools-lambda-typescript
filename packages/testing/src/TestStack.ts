import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { App, Stack } from 'aws-cdk-lib';
import { AwsCdkCli, RequireApproval } from '@aws-cdk/cli-lib-alpha';
import type { ICloudAssemblyDirectoryProducer } from '@aws-cdk/cli-lib-alpha';

class TestStack implements ICloudAssemblyDirectoryProducer {
  public app: App;
  public cli: AwsCdkCli;
  public stackRef: Stack;

  public constructor(stackName: string) {
    this.app = new App();
    this.stackRef = new Stack(this.app, stackName);
    this.cli = AwsCdkCli.fromCloudAssemblyDirectoryProducer(this);
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
      `${this.stackRef.stackName}.outputs.json`
    );
    await this.cli.deploy({
      stacks: [this.stackRef.stackName],
      requireApproval: RequireApproval.NEVER,
      outputsFile: outputFilePath,
    });

    return JSON.parse(await readFile(outputFilePath, 'utf-8'))[
      this.stackRef.stackName
    ];
  }

  /**
   * Destroy the test stack.
   */
  public async destroy(): Promise<void> {
    await this.cli.destroy({
      stacks: [this.stackRef.stackName],
      requireApproval: false,
    });
  }

  public async produce(_context: Record<string, unknown>): Promise<string> {
    return this.app.synth().directory;
  }

  public async synth(): Promise<void> {
    await this.cli.synth({
      stacks: [this.stackRef.stackName],
    });
  }
}

export { TestStack };
