import { BaseProvider, DEFAULT_PROVIDERS } from './BaseProvider';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import type { SSMClientConfig, GetParameterCommandInput } from '@aws-sdk/client-ssm';
import type { SSMGetOptionsInterface } from 'types/SSMProvider';

class SSMProvider extends BaseProvider {
  public client: SSMClient;

  public constructor(config: SSMClientConfig = {}) {
    super();
    this.client = new SSMClient(config);
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

  protected _getMultiple(_path: string): Promise<Record<string, string | undefined>> {
    throw Error('Not implemented.');
  }
}

const getParameter = (name: string, options?: SSMGetOptionsInterface): Promise<undefined | string | Record<string, unknown>> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }

  return DEFAULT_PROVIDERS.ssm.get(name, options);
};

export {
  SSMProvider,
  getParameter,
};