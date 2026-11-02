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

/**
 * Adds a field name to the `Vary` header, keeping any fields already listed.
 *
 * The field is not added again when already listed (compared case-insensitively),
 * and a `Vary: *` header is left untouched because it already covers every field.
 *
 * Vary: https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.5
 *
 * @param headers - The response headers to update
 * @param fieldName - The request header field name the response varies on
 */
const appendVaryHeader = (headers: Headers, fieldName: string): void => {
  const vary = headers.get('vary');
  if (vary === null || vary.trim() === '') {
    headers.set('vary', fieldName);
    return;
  }

  const fields = vary.split(',').map((field) => field.trim().toLowerCase());
  if (fields.includes('*') || fields.includes(fieldName.toLowerCase())) {
    return;
  }

  headers.set('vary', `${vary}, ${fieldName}`);
};

export { appendVaryHeader, getClientIp };
