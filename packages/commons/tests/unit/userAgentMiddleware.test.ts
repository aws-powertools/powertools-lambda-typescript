import { addUserAgentMiddleware } from '../../src/middleware/userAgentMiddleware';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

describe('Function: addUserAgentMiddleware', () => {
  it('adds powertools user agent to request header at the end', async () => {
    const lambdaClient = new LambdaClient({
      logger: console,
      region: 'us-east-1',
      endpoint: 'http://localhost:9001',
      maxAttempts: 1, // disable retry to have the correct number of assertions
    });
    addUserAgentMiddleware(lambdaClient, 'my-feature');

    expect(lambdaClient.middlewareStack.identify()).toContain(
      'addPowertoolsToUserAgent: POWERTOOLS,USER_AGENT'
    );

    lambdaClient.middlewareStack.add(
      (next) => (args) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const userAgent = args?.request?.headers['user-agent'];
        expect(userAgent).toContain('PT/my-feature/1.10.0 PTEnv/NA');
        // make sure it's at the end of the user agent
        expect(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          userAgent
            ?.split(' ')
            .slice(userAgent?.split(' ').length - 2)
            .join(' ')
        ).toEqual('PT/my-feature/1.10.0 PTEnv/NA');

        return next(args);
      },
      {
        step: 'finalizeRequest',
      }
    );
    try {
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: 'test',
          Payload: new TextEncoder().encode(JSON.stringify('foo')),
        })
      );
    } catch (e) {}
  });
});
