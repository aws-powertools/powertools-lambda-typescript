import { addUserAgentMiddleware } from '../../src/userAgentMiddleware';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

/**
 * Logs request headers
 *
 * This is a middleware we use to test
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const logHeadersMiddleware = (next, _context) => async (args) => {
  console.log(args.request.headers);

  return await next(args);
};

describe('Function: addUserAgentMiddleware', () => {
  it('adds powertools user agent to request header at the end', async () => {
    const lambdaClient = new LambdaClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:9001',
    });

    // Set a spy on the console.log method, so we can check the headers
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    addUserAgentMiddleware(lambdaClient, 'my-feature');

    expect(lambdaClient.middlewareStack.identify()).toContain(
      'addPowertoolsToUserAgent: POWERTOOLS,USER_AGENT'
    );

    lambdaClient.middlewareStack.addRelativeTo(logHeadersMiddleware, {
      relation: 'after',
      toMiddleware: 'addPowertoolsToUserAgent',
      name: 'logHeadersMiddleware',
      tags: ['TEST'],
    });

    await expect(() =>
      lambdaClient.send(
        new InvokeCommand({
          FunctionName: 'test',
          Payload: new TextEncoder().encode(JSON.stringify('foo')),
        })
      )
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        'user-agent': expect.stringContaining('PT/my-feature/1.10.0 PTEnv/NA'),
      })
    );
  });
});
