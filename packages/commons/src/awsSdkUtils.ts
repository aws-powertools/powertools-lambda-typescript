import { PT_VERSION } from './version.js';
import type { MiddlewareArgsLike, SdkClient } from './types/awsSdk.js';

/**
 * @internal
 */
const EXEC_ENV = process.env.AWS_EXECUTION_ENV || 'NA';
const middlewareOptions = {
  relation: 'after',
  toMiddleware: 'getUserAgentMiddleware',
  name: 'addPowertoolsToUserAgent',
  tags: ['POWERTOOLS', 'USER_AGENT'],
};

/**
 * @internal
 * Type guard to check if the client provided is a valid AWS SDK v3 client
 */
const isSdkClient = (client: unknown): client is SdkClient =>
  typeof client === 'object' &&
  client !== null &&
  'send' in client &&
  typeof client.send === 'function' &&
  'config' in client &&
  client.config !== undefined &&
  typeof client.config === 'object' &&
  client.config !== null &&
  'middlewareStack' in client &&
  client.middlewareStack !== undefined &&
  typeof client.middlewareStack === 'object' &&
  client.middlewareStack !== null &&
  'identify' in client.middlewareStack &&
  typeof client.middlewareStack.identify === 'function' &&
  'addRelativeTo' in client.middlewareStack &&
  typeof client.middlewareStack.addRelativeTo === 'function';

/**
 * @internal
 * returns a middleware function for the MiddlewareStack, that can be used for the SDK clients
 * @param feature
 */
const customUserAgentMiddleware = (feature: string) => {
  return <T extends MiddlewareArgsLike>(next: (arg0: T) => Promise<T>) =>
    async (args: T) => {
      const powertoolsUserAgent = `PT/${feature}/${PT_VERSION} PTEnv/${EXEC_ENV}`;
      args.request.headers['user-agent'] =
        `${args.request.headers['user-agent']} ${powertoolsUserAgent}`;

      return await next(args);
    };
};

/**
 * @internal
 * Checks if the middleware stack already has the Powertools UA middleware
 */
const hasPowertools = (middlewareStack: string[]): boolean => {
  let found = false;
  for (const middleware of middlewareStack) {
    if (middleware.includes('addPowertoolsToUserAgent')) {
      found = true;
    }
  }

  return found;
};

const addUserAgentMiddleware = (client: unknown, feature: string): void => {
  try {
    if (isSdkClient(client)) {
      if (hasPowertools(client.middlewareStack.identify())) {
        return;
      }
      client.middlewareStack.addRelativeTo(
        customUserAgentMiddleware(feature),
        middlewareOptions
      );
    } else {
      throw new Error(
        `The client provided does not match the expected interface`
      );
    }
  } catch (error) {
    console.warn('Failed to add user agent middleware', error);
  }
};

export { customUserAgentMiddleware, addUserAgentMiddleware, isSdkClient };
