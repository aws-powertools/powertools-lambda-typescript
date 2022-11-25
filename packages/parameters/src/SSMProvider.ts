import { BaseProvider } from './BaseProvider';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import type { SSMClientConfig, GetParameterCommandInput } from '@aws-sdk/client-ssm';

interface SSMProviderOptionsBase {
  awsSdkV3Client?: SSMClient
  sdkConfig?: SSMClientConfig
}

interface SSMOne extends SSMProviderOptionsBase {
  awsSdkV3Client?: SSMClient
  sdkConfig?: never
}

interface SSMTwo extends SSMProviderOptionsBase {
  awsSdkV3Client?: never
  sdkConfig?: SSMClientConfig
}

type SSMProviderOptions = SSMOne | SSMTwo;

class SSMProvider extends BaseProvider {
  public client: SSMClient;

  public constructor(options: SSMProviderOptions = {}) {
    super();
    this.client = new SSMClient(options);
  }

  protected async _get(name: string, sdkOptions?: Partial<GetParameterCommandInput>): Promise<string | undefined> {
    const options: GetParameterCommandInput = {
      Name: name,
    };
    if (sdkOptions) {
      Object.assign(options, sdkOptions);
    }
    const result = await this.client.send(new GetParameterCommand(options));

    return result.Parameter?.Value;
  }

  protected async _getMultiple(_path: string): Promise<Record<string, string | undefined>> {
    throw Error('Not implemented.');
  }
}

export {
  SSMProvider
};