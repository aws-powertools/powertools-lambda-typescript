import { addUserAgentMiddleware } from '../../src/userAgentMiddleware';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { PT_VERSION } from '../../src/version';
import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { RelativeMiddlewareOptions } from '@aws-sdk/types/dist-types/middleware';

type SupportedSdkClients =
  | LambdaClient
  | DynamoDBClient
  | SSMClient
  | SecretsManagerClient
  | AppConfigDataClient;

type SupportedSdkCommands =
  | InvokeCommand
  | ScanCommand
  | GetParameterCommand
  | GetSecretValueCommand;

const options = {
  region: 'us-east-1',
  endpoint: 'http://localhost:9001',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
    sessionToken: 'test',
  },
};

const assertMiddleware = (feature: string) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (next) => (args) => {
    const userAgent = args?.request?.headers['user-agent'];
    expect(userAgent).toContain(`PT/${feature}/${PT_VERSION} PTEnv/NA`);
    // make sure it's at the end of the user agent
    expect(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      userAgent
        ?.split(' ')
        .slice(userAgent?.split(' ').length - 2) // take the last to entries of the user-agent header
        .join(' ')
    ).toEqual(`PT/${feature}/${PT_VERSION} PTEnv/NA`);

    return next(args);
  };
};

const assertMiddlewareOptions: RelativeMiddlewareOptions = {
  relation: 'after',
  toMiddleware: 'addPowertoolsToUserAgent',
  name: 'testUserAgentHeader',
  tags: ['TEST'],
};

const runCommand = async (
  client: SupportedSdkClients,
  command: SupportedSdkCommands
): Promise<unknown> => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return await client.send(command);
  } catch (e) {
    // throw only jest errors and swallow the SDK client errors like credentials or connection issues
    if (
      e instanceof Error &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      e.matcherResult !== undefined &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      e.matcherResult.pass === false
    ) {
      throw e;
    }
  }
};

describe('Given a client of instance: ', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => null);

  it.each([
    {
      name: 'LambdaClient',
      client: new LambdaClient(options),
      command: new InvokeCommand({ FunctionName: 'test', Payload: '' }),
    },
    {
      name: 'DynamoDBClient',
      client: new DynamoDBClient(options),
      command: new ScanCommand({ TableName: 'test' }),
    },
    {
      name: 'SSMClient',
      client: new SSMClient(options),
      command: new GetParameterCommand({ Name: 'test' }),
    },
    {
      name: 'AppConfigDataClient',
      client: new AppConfigDataClient(options),
      command: new GetParameterCommand({ Name: 'test' }),
    },
    {
      name: 'SecretsManagerClient',
      client: new SecretsManagerClient(options),
      command: new GetSecretValueCommand({ SecretId: 'test' }),
    },
  ])(
    `using $name, add powertools user agent to request header at the end`,
    async ({ client, command }) => {
      addUserAgentMiddleware(client, 'my-feature');

      expect(client.middlewareStack.identify()).toContain(
        'addPowertoolsToUserAgent: POWERTOOLS,USER_AGENT'
      );

      client.middlewareStack.addRelativeTo(
        assertMiddleware('my-feature'),
        assertMiddlewareOptions
      );

      await runCommand(client, command);
    }
  );

  it('should not throw error, when client fails to add middleware', () => {
    // create mock client that throws error when adding middleware
    const client = {
      middlewareStack: {
        addRelativeTo: () => {
          throw new Error('test');
        },
      },
    };

    expect(() => addUserAgentMiddleware(client, 'my-feature')).not.toThrow();
  });

  it('should no-op if we add the middleware twice', async () => {
    const client = new LambdaClient(options);
    const command = new InvokeCommand({ FunctionName: 'test', Payload: '' });
    addUserAgentMiddleware(client, 'my-feature');
    addUserAgentMiddleware(client, 'your-feature');

    client.middlewareStack.addRelativeTo(
      assertMiddleware('my-feature'),
      assertMiddlewareOptions
    );
    await runCommand(client, command);

    expect(client.middlewareStack.identify()).toContain(
      'addPowertoolsToUserAgent: POWERTOOLS,USER_AGENT'
    );
  });
});
