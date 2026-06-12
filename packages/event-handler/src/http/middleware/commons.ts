import type { RequestContext } from '../../types/http.js';

/**
 * Extracts the client IP address from the request context.
 *
 * For API Gateway events the source IP is taken from the request context, while
 * for ALB (or any other source) it falls back to the `X-Forwarded-For` header.
 *
 * @param reqCtx - The request context for the current request
 */
const getClientIp = (reqCtx: RequestContext): string | undefined => {
  if (reqCtx.responseType === 'ApiGatewayV1') {
    return reqCtx.event.requestContext.identity.sourceIp;
  }
  if (reqCtx.responseType === 'ApiGatewayV2') {
    return reqCtx.event.requestContext.http.sourceIp;
  }
  const xForwardedFor = reqCtx.req.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return undefined;
};

export { getClientIp };
