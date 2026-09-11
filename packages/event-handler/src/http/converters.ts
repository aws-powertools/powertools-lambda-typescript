import { Readable } from 'node:stream';
import type streamWeb from 'node:stream/web';
import type {
  ALBEvent,
  ALBResult,
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import type { BodyInit } from 'undici-types';
import type {
  ClassifiedEvent,
  ExtendedAPIGatewayProxyResult,
  ExtendedAPIGatewayProxyResultBody,
  HandlerResponse,
  HttpMethod,
  HttpStatusCode,
  ResponseType,
  ResponseTypeMap,
  V1Headers,
  WebResponseToProxyResultOptions,
} from '../types/http.js';
import {
  HttpStatusCodes,
  HttpStatusText,
  HttpVerbs,
  MULTI_VALUE_HEADERS_ALLOWLIST,
} from './constants.js';
import { InvalidEventError, InvalidHttpMethodError } from './errors.js';
import type { Router } from './Router.js';
import {
  isALBEvent,
  isAPIGatewayProxyEventV1,
  isAPIGatewayProxyEventV2,
  isBinaryResult,
  isExtendedAPIGatewayProxyResult,
  isHttpMethod,
  isNodeReadableStream,
  isWebReadableStream,
} from './utils.js';

/**
 * Identifies the integration and retains its narrowed event.
 *
 * @param event - The incoming Lambda event
 * @internal
 */
const classifyEvent = (event: unknown): ClassifiedEvent => {
  if (isAPIGatewayProxyEventV2(event)) {
    return { responseType: 'ApiGatewayV2', event };
  }
  if (isALBEvent(event)) {
    return { responseType: 'ALB', event };
  }
  if (isAPIGatewayProxyEventV1(event)) {
    return { responseType: 'ApiGatewayV1', event };
  }
  throw new InvalidEventError();
};

/**
 * Uppercases the event's HTTP method and rejects unsupported methods.
 *
 * @param classified - The event and its integration
 */
const normalizeHttpMethod = (classified: ClassifiedEvent): HttpMethod => {
  const rawMethod =
    classified.responseType === 'ApiGatewayV2'
      ? classified.event.requestContext.http.method
      : classified.event.httpMethod;
  const method = rawMethod.toUpperCase();
  if (!isHttpMethod(method)) {
    throw new InvalidHttpMethodError(method);
  }
  return method;
};

/**
 * Preserves text bodies and decodes base64 bodies into bytes.
 *
 * GET and HEAD requests are not allowed to carry a body when constructing a
 * Web API {@link Request | `Request`}, so any body present on the event is ignored for those methods.
 *
 * @param body - The raw body from the API Gateway event
 * @param isBase64Encoded - Whether the body is base64 encoded
 * @param httpMethod - The HTTP method of the request
 */
const createBody = (
  body: string | null,
  isBase64Encoded: boolean,
  httpMethod: HttpMethod
): string | Uint8Array | null => {
  if (httpMethod === HttpVerbs.GET || httpMethod === HttpVerbs.HEAD) {
    return null;
  }

  if (body === null) return null;

  if (!isBase64Encoded) {
    return body;
  }
  return Buffer.from(body, 'base64');
};

/**
 * Normalizes single-value headers, multi-value headers, and cookies.
 *
 * @param classified - The event and its integration
 */
const createHeaders = (classified: ClassifiedEvent): Headers => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(classified.event.headers ?? {})) {
    if (value !== undefined) headers.set(name, value);
  }

  if (classified.responseType === 'ApiGatewayV2') {
    const { cookies } = classified.event;
    if (Array.isArray(cookies)) {
      headers.set('Cookie', cookies.join('; '));
    }
    return headers;
  }

  for (const [name, values] of Object.entries(
    classified.event.multiValueHeaders ?? {}
  )) {
    for (const value of values ?? []) {
      const headerValue = headers.get(name);
      if (!headerValue?.includes(value)) {
        headers.append(name, value);
      }
    }
  }

  return headers;
};

/**
 * Populates URL search parameters from single and multi-value query string parameters.
 *
 * @param url - The URL object to populate
 * @param event - The API Gateway v1 or ALB event
 */
const populateV1QueryParams = (
  url: URL,
  event: APIGatewayProxyEvent | ALBEvent
): void => {
  for (const [name, value] of Object.entries(
    event.queryStringParameters ?? {}
  )) {
    if (value != null && !event.multiValueQueryStringParameters?.[name]) {
      url.searchParams.append(name, value);
    }
  }

  for (const [name, values] of Object.entries(
    event.multiValueQueryStringParameters ?? {}
  )) {
    for (const value of values ?? []) {
      url.searchParams.append(name, value);
    }
  }
};

/**
 * Builds a URL from the structured path and query fields used by v1 and ALB.
 *
 * Retains the existing URL resolution and query encoding behavior for both sources.
 *
 * @param event - The API Gateway v1 or ALB event
 * @param headers - The normalized request headers
 * @param fallbackHostname - The hostname to use when the Host header is absent
 */
const createStructuredUrl = (
  event: APIGatewayProxyEvent | ALBEvent,
  headers: Headers,
  fallbackHostname: string | undefined
): URL => {
  const hostname = headers.get('Host') ?? fallbackHostname;
  const protocol = headers.get('X-Forwarded-Proto') ?? 'https';

  const url = new URL(event.path, `${protocol}://${hostname}/`);
  populateV1QueryParams(url, event);
  return url;
};

/**
 * Builds a Web URL using the integration's path and query representation.
 *
 * @param classified - The event and its integration
 * @param headers - The normalized request headers
 */
const createUrl = (classified: ClassifiedEvent, headers: Headers): URL => {
  switch (classified.responseType) {
    case 'ApiGatewayV1':
      return createStructuredUrl(
        classified.event,
        headers,
        classified.event.requestContext.domainName
      );
    case 'ApiGatewayV2': {
      const { event } = classified;
      const hostname = headers.get('Host') ?? event.requestContext.domainName;
      const protocol = headers.get('X-Forwarded-Proto') ?? 'https';
      const url = `${protocol}://${hostname}${event.rawPath}`;
      return new URL(
        event.rawQueryString ? `${url}?${event.rawQueryString}` : url
      );
    }
    case 'ALB':
      return createStructuredUrl(classified.event, headers, 'localhost');
  }
};

/**
 * Constructs a Web Request from an already-classified event.
 *
 * @param classified - The event and its integration
 * @internal
 */
const classifiedEventToWebRequest = (classified: ClassifiedEvent): Request => {
  const method = normalizeHttpMethod(classified);
  const headers = createHeaders(classified);
  const url = createUrl(classified, headers);
  return new Request(url, {
    method,
    headers,
    body: createBody(
      classified.event.body ?? null,
      classified.event.isBase64Encoded,
      method
    ),
  });
};

/**
 * Converts an API Gateway proxy event (V1 or V2) or ALB event to a Web API Request object.
 * Automatically detects the integration and normalizes its request fields.
 *
 * @deprecated This converter is an implementation detail and will be removed in a future major version. Access `reqCtx.req` in {@link Router | `Router`} handlers or middleware instead.
 * @param event - The API Gateway proxy event (V1 or V2) or ALB event
 */
const proxyEventToWebRequest = (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2 | ALBEvent
): Request => {
  return classifiedEventToWebRequest(classifyEvent(event));
};

/**
 * Converts Web API Headers to API Gateway V1 headers format.
 * Splits multi-value headers by comma or semicolon and organizes them into separate objects.
 *
 * @param webHeaders - The Web API Headers object
 * @returns Object containing headers and multiValueHeaders
 */
const webHeadersToApiGatewayV1Headers = (webHeaders: Headers) => {
  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, Array<string>> = {};

  const cookies = webHeaders.getSetCookie();
  const allCookies: string[] = [];
  for (const cookie of cookies) {
    allCookies.push(...cookie.split(',').map((v) => v.trimStart()));
  }

  if (allCookies.length > 1) {
    multiValueHeaders['set-cookie'] = allCookies;
  } else if (allCookies.length === 1) {
    headers['set-cookie'] = allCookies[0];
  }

  for (const [key, value] of webHeaders.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      continue;
    }

    const lowerKey = key.toLowerCase();

    // Only split on comma if the header is an allowed multi-value header or starts with access-control-
    if (
      MULTI_VALUE_HEADERS_ALLOWLIST.has(lowerKey) ||
      lowerKey.startsWith('access-control-')
    ) {
      const values = value.split(',').map((v) => v.trimStart());

      if (values.length > 1) {
        multiValueHeaders[key] = values;
      } else {
        headers[key] = value;
      }
    } else {
      headers[key] = value;
    }
  }

  return {
    headers,
    multiValueHeaders,
  };
};

/**
 * Converts Web API Headers to API Gateway V2 headers format.
 *
 * @param webHeaders - The Web API Headers object
 * @returns Object containing headers
 */
const webHeadersToApiGatewayV2Headers = (webHeaders: Headers) => {
  const headers: Record<string, string> = {};

  for (const [key, value] of webHeaders.entries()) {
    headers[key] = value;
  }

  return { headers };
};

const webHeadersToApiGatewayHeaders = <T extends ResponseType>(
  webHeaders: Headers,
  responseType: T
): T extends 'ApiGatewayV1'
  ? V1Headers
  : { headers: Record<string, string> } => {
  if (responseType === 'ApiGatewayV1') {
    return webHeadersToApiGatewayV1Headers(
      webHeaders
    ) as T extends 'ApiGatewayV1'
      ? V1Headers
      : { headers: Record<string, string> };
  }
  return webHeadersToApiGatewayV2Headers(webHeaders) as T extends 'ApiGatewayV1'
    ? V1Headers
    : { headers: Record<string, string> };
};

const responseBodyToBase64 = async (response: Response) => {
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
};

/**
 * Converts a Web API Response object to an API Gateway V1 proxy result.
 *
 * @param response - The Web API Response object
 * @param isBase64Encoded - Whether the response body should be base64 encoded (e.g., for binary or compressed content)
 * @returns An API Gateway V1 proxy result
 */
const webResponseToProxyResultV1 = async (
  response: Response,
  isBase64Encoded?: boolean
): Promise<APIGatewayProxyResult> => {
  const { headers, multiValueHeaders } = webHeadersToApiGatewayV1Headers(
    response.headers
  );

  const body = isBase64Encoded
    ? await responseBodyToBase64(response)
    : await response.text();

  const result: APIGatewayProxyResult = {
    statusCode: response.status,
    headers,
    body,
    isBase64Encoded,
  };

  if (Object.keys(multiValueHeaders).length > 0) {
    result.multiValueHeaders = multiValueHeaders;
  }

  return result;
};

/**
 * Converts a Web API Response object to an API Gateway V2 proxy result.
 *
 * @param response - The Web API Response object
 * @param isBase64Encoded - Whether the response body should be base64 encoded (e.g., for binary or compressed content)
 * @returns An API Gateway V2 proxy result
 */
const webResponseToProxyResultV2 = async (
  response: Response,
  isBase64Encoded?: boolean
): Promise<APIGatewayProxyStructuredResultV2> => {
  const headers: Record<string, string> = {};
  const cookies: string[] = [];

  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      cookies.push(...value.split(',').map((v) => v.trimStart()));
    } else {
      headers[key] = value;
    }
  }

  const body = isBase64Encoded
    ? await responseBodyToBase64(response)
    : await response.text();

  const result: APIGatewayProxyStructuredResultV2 = {
    statusCode: response.status,
    headers,
    body,
    isBase64Encoded,
  };

  if (cookies.length > 0) {
    result.cookies = cookies;
  }

  return result;
};

/**
 * Converts a Web API Response object to an ALB result.
 *
 * @param response - The Web API Response object
 * @param isBase64Encoded - Whether the response body should be base64 encoded (e.g., for binary or compressed content)
 * @returns An ALB result
 */
const webResponseToALBResult = async (
  response: Response,
  isBase64Encoded?: boolean
): Promise<ALBResult> => {
  const { headers, multiValueHeaders } = webHeadersToApiGatewayV1Headers(
    response.headers
  );

  const body = isBase64Encoded
    ? await responseBodyToBase64(response)
    : await response.text();

  const statusText = response.statusText || HttpStatusText[response.status];

  const result: ALBResult = {
    statusCode: response.status,
    statusDescription: `${response.status} ${statusText}`,
    headers,
    body,
    isBase64Encoded,
  };

  if (Object.keys(multiValueHeaders).length > 0) {
    result.multiValueHeaders = multiValueHeaders;
  }

  return result;
};

const webResponseToProxyResult = <T extends ResponseType>(
  response: Response,
  responseType: T,
  options?: WebResponseToProxyResultOptions
): Promise<ResponseTypeMap[T]> => {
  const isBase64Encoded = options?.isBase64Encoded ?? false;
  if (responseType === 'ApiGatewayV1') {
    return webResponseToProxyResultV1(response, isBase64Encoded) as Promise<
      ResponseTypeMap[T]
    >;
  }
  if (responseType === 'ALB') {
    return webResponseToALBResult(response, isBase64Encoded) as Promise<
      ResponseTypeMap[T]
    >;
  }
  return webResponseToProxyResultV2(response, isBase64Encoded) as Promise<
    ResponseTypeMap[T]
  >;
};

/**
 * Adds headers from an ExtendedAPIGatewayProxyResult to a Headers object.
 *
 * @param headers - The Headers object to mutate
 * @param response - The response containing headers to add
 * @remarks This function mutates the headers object by adding entries from
 * response.headers, response.multiValueHeaders, and response.cookies
 */
function addProxyEventHeaders(
  headers: Headers,
  response: ExtendedAPIGatewayProxyResult
) {
  for (const [key, value] of Object.entries(response.headers ?? {})) {
    /* v8 ignore else -- @preserve */
    if (value != null) {
      headers.set(key, String(value));
    }
  }

  for (const [key, values] of Object.entries(
    response.multiValueHeaders ?? {}
  )) {
    for (const value of values ?? []) {
      headers.append(key, String(value));
    }
  }

  if (response.cookies && response.cookies.length > 0) {
    for (const cookie of response.cookies) {
      headers.append('Set-Cookie', cookie);
    }
  }
}

/**
 * Converts a handler response to a Web API Response object.
 * Handles APIGatewayProxyResult, Response objects, and plain objects.
 *
 * @param response - The handler response (APIGatewayProxyResult, Response, or plain object)
 * @param options - Optional configuration with statusCode and resHeaders
 * @returns A Web API Response object
 */
const handlerResultToWebResponse = (
  response: HandlerResponse,
  options?: { statusCode?: HttpStatusCode; resHeaders?: Headers }
): Response => {
  const statusCode = options?.statusCode ?? HttpStatusCodes.OK;
  const resHeaders = options?.resHeaders;
  if (response instanceof Response) {
    if (resHeaders === undefined) return response;
    const headers = new Headers(resHeaders);
    for (const [key, value] of response.headers.entries()) {
      headers.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }

  const headers = new Headers(resHeaders);

  if (isBinaryResult(response)) {
    const body =
      response instanceof Readable
        ? (Readable.toWeb(response) as ReadableStream)
        : response;

    return new Response(body, {
      status: statusCode,
      headers,
    });
  }

  headers.set('Content-Type', 'application/json');

  if (isExtendedAPIGatewayProxyResult(response)) {
    addProxyEventHeaders(headers, response);

    let body: BodyInit | null;
    if (response.body === undefined || response.body === null) {
      body = null;
    } else if (isNodeReadableStream(response.body)) {
      body = Readable.toWeb(response.body) as ReadableStream;
    } else if (typeof response.body === 'string') {
      // a base64 body is decoded so the Response carries the raw bytes
      body = response.isBase64Encoded
        ? Buffer.from(response.body, 'base64')
        : response.body;
    } else if (
      isWebReadableStream(response.body) ||
      response.body instanceof ArrayBuffer
    ) {
      body = response.body;
    } else {
      body = JSON.stringify(response.body);
    }

    return new Response(body, {
      status: response.statusCode,
      headers,
    });
  }
  return Response.json(response, { headers, status: statusCode });
};

/**
 * Converts various body types to a Node.js Readable stream.
 * Handles Node.js streams, web streams, and string bodies.
 *
 * @param body - The body to convert (Readable, ReadableStream, or string)
 * @returns A Node.js Readable stream
 */
const bodyToNodeStream = (body: ExtendedAPIGatewayProxyResultBody) => {
  if (isNodeReadableStream(body)) {
    return body;
  }
  if (isWebReadableStream(body)) {
    return Readable.fromWeb(body as streamWeb.ReadableStream);
  }
  if (body instanceof ArrayBuffer) {
    return Readable.from(Buffer.from(body));
  }
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  return Readable.from(Buffer.from(bodyStr));
};

export {
  bodyToNodeStream,
  classifiedEventToWebRequest,
  classifyEvent,
  handlerResultToWebResponse,
  proxyEventToWebRequest,
  webHeadersToApiGatewayHeaders,
  webResponseToProxyResult,
};
