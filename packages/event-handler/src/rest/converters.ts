import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type {
  CompressionOptions,
  HandlerResponse,
  HttpStatusCode,
} from '../types/rest.js';
import { COMPRESSION_ENCODING_TYPES, HttpStatusCodes } from './constants.js';
import { isAPIGatewayProxyResult } from './utils.js';

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
 * Converts an API Gateway proxy event to a Web API Request object.
 *
 * @param event - The API Gateway proxy event
 * @returns A Web API Request object
 */
export const proxyEventToWebRequest = (
  event: APIGatewayProxyEvent
): Request => {
  const { httpMethod, path } = event;
  const { domainName } = event.requestContext;

  const headers = new Headers();
  for (const [name, value] of Object.entries(event.headers ?? {})) {
    if (value != null) headers.set(name, value);
  }

  for (const [name, values] of Object.entries(event.multiValueHeaders ?? {})) {
    for (const value of values ?? []) {
      const headerValue = headers.get(name);
      if (!headerValue?.includes(value)) {
        headers.append(name, value);
      }
    }
  }
  const hostname = headers.get('Host') ?? domainName;
  const protocol = headers.get('X-Forwarded-Proto') ?? 'https';

  const url = new URL(path, `${protocol}://${hostname}/`);

  for (const [name, value] of Object.entries(
    event.queryStringParameters ?? {}
  )) {
    if (value != null) url.searchParams.append(name, value);
  }

  for (const [name, values] of Object.entries(
    event.multiValueQueryStringParameters ?? {}
  )) {
    for (const value of values ?? []) {
      url.searchParams.append(name, value);
    }
  }
  return new Request(url.toString(), {
    method: httpMethod,
    headers,
    body: createBody(event.body, event.isBase64Encoded),
  });
};

/**
 * Converts a Web API Response object to an API Gateway proxy result.
 *
 * @param response - The Web API Response object
 * @returns An API Gateway proxy result
 */
export const webResponseToProxyResult = async (
  response: Response
): Promise<APIGatewayProxyResult> => {
  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, Array<string>> = {};

  for (const [key, value] of response.headers.entries()) {
    const values = value.split(',').map((v) => v.trimStart());
    if (values.length > 1) {
      multiValueHeaders[key] = values;
    } else {
      headers[key] = value;
    }
  }

  // Check if response contains compressed/binary content
  const contentEncoding = response.headers.get(
    'content-encoding'
  ) as CompressionOptions['encoding'];
  let body: string;
  let isBase64Encoded = false;

  if (
    contentEncoding &&
    [
      COMPRESSION_ENCODING_TYPES.GZIP,
      COMPRESSION_ENCODING_TYPES.DEFLATE,
    ].includes(contentEncoding)
  ) {
    // For compressed content, get as buffer and encode to base64
    const buffer = await response.arrayBuffer();
    body = Buffer.from(buffer).toString('base64');
    isBase64Encoded = true;
  } else {
    // For text content, use text()
    body = await response.text();
  }

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
 * Converts a handler response to a Web API Response object.
 * Handles APIGatewayProxyResult, Response objects, and plain objects.
 *
 * @param response - The handler response (APIGatewayProxyResult, Response, or plain object)
 * @param headers - Optional headers to be included in the response
 * @returns A Web API Response object
 */
export const handlerResultToWebResponse = (
  response: HandlerResponse,
  resHeaders?: Headers
): Response => {
  if (response instanceof Response) {
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
  headers.set('Content-Type', 'application/json');

  if (isAPIGatewayProxyResult(response)) {
    for (const [key, value] of Object.entries(response.headers ?? {})) {
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

    return new Response(response.body, {
      status: response.statusCode,
      headers,
    });
  }
  return Response.json(response, { headers });
};

/**
 * Converts a handler response to an API Gateway proxy result.
 * Handles APIGatewayProxyResult, Response objects, and plain objects.
 *
 * @param response - The handler response (APIGatewayProxyResult, Response, or plain object)
 * @param statusCode - The response status code to return
 * @returns An API Gateway proxy result
 */
export const handlerResultToProxyResult = async (
  response: HandlerResponse,
  statusCode: HttpStatusCode = HttpStatusCodes.OK
): Promise<APIGatewayProxyResult> => {
  if (isAPIGatewayProxyResult(response)) {
    return response;
  }
  if (response instanceof Response) {
    return await webResponseToProxyResult(response);
  }
  return {
    statusCode,
    body: JSON.stringify(response),
    headers: { 'content-type': 'application/json' },
    isBase64Encoded: false,
  };
};
