import { Readable } from 'node:stream';
import type streamWeb from 'node:stream/web';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import type {
  ExtendedAPIGatewayProxyResult,
  ExtendedAPIGatewayProxyResultBody,
  HandlerResponse,
  HttpStatusCode,
  ResponseType,
  ResponseTypeMap,
  V1Headers,
  WebResponseToProxyResultOptions,
} from '../types/rest.js';
import { HttpStatusCodes } from './constants.js';
import { InvalidHttpMethodError } from './errors.js';
import {
  isAPIGatewayProxyEventV2,
  isBinaryResult,
  isExtendedAPIGatewayProxyResult,
  isHttpMethod,
  isNodeReadableStream,
  isWebReadableStream,
} from './utils.js';

/**
 * Creates a request body from API Gateway event body, handling base64 decoding if needed.
 *
 * @param body - The raw body from the API Gateway event
 * @param isBase64Encoded - Whether the body is base64 encoded
 * @returns The decoded body string or null
 */
const createBody = (body: string | null, isBase64Encoded: boolean) => {
  if (body === null) return null;

  if (!isBase64Encoded) {
    return body;
  }
  return Buffer.from(body, 'base64').toString('utf8');
};

/**
 * Populates headers from single and multi-value header entries.
 *
 * @param headers - The Headers object to populate
 * @param event - The API Gateway proxy event
 */
const populateV1Headers = (
  headers: Headers,
  event: APIGatewayProxyEvent
): void => {
  for (const [name, value] of Object.entries(event.headers ?? {})) {
    if (value !== undefined) headers.set(name, value);
  }

  for (const [name, values] of Object.entries(event.multiValueHeaders ?? {})) {
    for (const value of values ?? []) {
      const headerValue = headers.get(name);
      if (!headerValue?.includes(value)) {
        headers.append(name, value);
      }
    }
  }
};

/**
 * Populates URL search parameters from single and multi-value query string parameters.
 *
 * @param url - The URL object to populate
 * @param event - The API Gateway proxy event
 */
const populateV1QueryParams = (url: URL, event: APIGatewayProxyEvent): void => {
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
 * Converts an API Gateway proxy event to a Web API Request object.
 *
 * @param event - The API Gateway proxy event
 * @returns A Web API Request object
 */
const proxyEventV1ToWebRequest = (event: APIGatewayProxyEvent): Request => {
  const { httpMethod, path } = event;
  const { domainName } = event.requestContext;

  const headers = new Headers();
  populateV1Headers(headers, event);

  const hostname = headers.get('Host') ?? domainName;
  const protocol = headers.get('X-Forwarded-Proto') ?? 'https';

  const url = new URL(path, `${protocol}://${hostname}/`);
  populateV1QueryParams(url, event);

  return new Request(url.toString(), {
    method: httpMethod,
    headers,
    body: createBody(event.body, event.isBase64Encoded),
  });
};

/**
 * Converts an API Gateway V2 proxy event to a Web API Request object.
 *
 * @param event - The API Gateway V2 proxy event
 * @returns A Web API Request object
 */
const proxyEventV2ToWebRequest = (event: APIGatewayProxyEventV2): Request => {
  const { rawPath, rawQueryString } = event;
  const {
    http: { method },
    domainName,
  } = event.requestContext;

  const headers = new Headers();
  for (const [name, value] of Object.entries(event.headers)) {
    if (value !== undefined) headers.set(name, value);
  }

  if (Array.isArray(event.cookies)) {
    headers.set('Cookie', event.cookies.join('; '));
  }

  const hostname = headers.get('Host') ?? domainName;
  const protocol = headers.get('X-Forwarded-Proto') ?? 'https';

  const url = rawQueryString
    ? `${protocol}://${hostname}${rawPath}?${rawQueryString}`
    : `${protocol}://${hostname}${rawPath}`;

  return new Request(url, {
    method,
    headers,
    body: createBody(event.body ?? null, event.isBase64Encoded),
  });
};

/**
 * Converts an API Gateway proxy event (V1 or V2) to a Web API Request object.
 * Automatically detects the event version and calls the appropriate converter.
 *
 * @param event - The API Gateway proxy event (V1 or V2)
 * @returns A Web API Request object
 */
const proxyEventToWebRequest = (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2
): Request => {
  if (isAPIGatewayProxyEventV2(event)) {
    const method = event.requestContext.http.method.toUpperCase();
    if (!isHttpMethod(method)) {
      throw new InvalidHttpMethodError(method);
    }
    return proxyEventV2ToWebRequest(event);
  }
  const method = event.requestContext.httpMethod.toUpperCase();
  if (!isHttpMethod(method)) {
    throw new InvalidHttpMethodError(method);
  }
  return proxyEventV1ToWebRequest(event);
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

  for (const [key, value] of webHeaders.entries()) {
    const values = value.split(/[;,]/).map((v) => v.trimStart());

    if (headers[key]) {
      multiValueHeaders[key] = [headers[key], ...values];
      delete headers[key];
    } else if (values.length > 1) {
      multiValueHeaders[key] = values;
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

    const body =
      response.body instanceof Readable
        ? (Readable.toWeb(response.body) as ReadableStream)
        : response.body;

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
  return Readable.from(Buffer.from(body as string));
};

export {
  proxyEventToWebRequest,
  webResponseToProxyResult,
  handlerResultToWebResponse,
  bodyToNodeStream,
  webHeadersToApiGatewayHeaders,
};
