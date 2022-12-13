import { BaseProvider, DEFAULT_PROVIDERS } from './BaseProvider';
import { SSMClient, GetParameterCommand, paginateGetParametersByPath } from '@aws-sdk/client-ssm';
import type { SSMClientConfig, GetParameterCommandInput, GetParametersByPathCommandInput } from '@aws-sdk/client-ssm';
import type { SSMGetMultipleOptionsInterface, SSMGetOptionsInterface } from 'types/SSMProvider';
import type { PaginationConfiguration } from '@aws-sdk/types';

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

  protected async _getMultiple(path: string, sdkOptions?: Partial<GetParametersByPathCommandInput>): Promise<Record<string, string | undefined>> {
    const options: GetParametersByPathCommandInput = {
      Path: path,
    };
    const paginationOptions: PaginationConfiguration = {
      client: this.client
    };
    if (sdkOptions) {
      Object.assign(options, sdkOptions);
      if (sdkOptions.MaxResults) {
        paginationOptions.pageSize = sdkOptions.MaxResults;
      }
    }

    const parameters: Record<string, string | undefined> = {};
    for await (const page of paginateGetParametersByPath(paginationOptions, options)) {
      for (const parameter of page.Parameters || []) {
        /**
         * Standardize the parameter name
         *
         * The parameter name returned by SSM will contain the full path.
         * However, for readability, we should return only the part after the path. 
         **/ 
        
        // If the parameter is present in the response, then it has a Name
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let name = parameter.Name!;
        name = name.replace(path, '');
        if (name.startsWith('/')) {
          name = name.replace('/', '');
        }
        parameters[name] = parameter.Value;
      }
    }

    return parameters;
  }
}

const getParameter = (name: string, options?: SSMGetOptionsInterface): Promise<undefined | string | Record<string, unknown>> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }

  return DEFAULT_PROVIDERS.ssm.get(name, options);
};

const getParameters = (path: string, options?: SSMGetMultipleOptionsInterface): Promise<undefined | Record<string, unknown>> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }

  return DEFAULT_PROVIDERS.ssm.getMultiple(path, options);
};

export {
  SSMProvider,
  getParameter,
  getParameters,
};