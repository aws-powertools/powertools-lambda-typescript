// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * @internal
 */
import { version as PT_VERSION } from '../version';
import { userAgentMiddleware } from '@aws-sdk/middleware-user-agent';

const EXEC_ENV = process.env.AWS_EXECUTION_ENV || 'NA';
const middlewareOptions = {
  step: 'finalizeRequest',
  name: 'addPowertoolsToUserAgent',
  tags: ['POWERTOOLS', 'USER_AGENT'],
};

/**
 * @internal
 * returns a middleware function for the MiddlewareStack, that can be used for the SDK clients
 * @param feature
 */
const customUserAgentMiddleware = (feature: string) => {
  return (next, _context) => async (args) => {
    const powertoolsUserAgent = `PT/${feature}/${PT_VERSION} PTEnv/${EXEC_ENV}`;
    args.request.headers['user-agent'] = args.request.headers['user-agent']
      ? `${args.request.headers['user-agent']} ${powertoolsUserAgent}`
      : `${powertoolsUserAgent}`;

    return await next(args);
  };
};

const addUserAgentMiddleware = (client, feature): void => {
  client.middlewareStack.add(
    customUserAgentMiddleware(feature),
    middlewareOptions
  );
};

export { addUserAgentMiddleware, userAgentMiddleware };
