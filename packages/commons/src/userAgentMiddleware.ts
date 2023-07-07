import { PT_VERSION } from './version';

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
 * returns a middleware function for the MiddlewareStack, that can be used for the SDK clients
 * @param feature
 */
const customUserAgentMiddleware = (feature: string) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (next, _context) => async (args) => {
    const powertoolsUserAgent = `PT/${feature}/${PT_VERSION} PTEnv/${EXEC_ENV}`;
    args.request.headers[
      'user-agent'
    ] = `${args.request.headers['user-agent']} ${powertoolsUserAgent}`;

    return await next(args);
  };
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const addUserAgentMiddleware = (client, feature: string): void => {
  try {
    if (
      client.middlewareStack
        .identify()
        .includes('addPowertoolsToUserAgent: POWERTOOLS,USER_AGENT')
    ) {
      return;
    }
    client.middlewareStack.addRelativeTo(
      customUserAgentMiddleware(feature),
      middlewareOptions
    );
  } catch (e) {
    console.warn('Failed to add user agent middleware', e);
  }
};

export { addUserAgentMiddleware };
