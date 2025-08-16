import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { HandlerResponse } from '../types/rest.js';
import { isAPIGatewayProxyResult } from './utils.js';

const createBody = (body: string | null, isBase64Encoded: boolean) => {
  if (body === null) return null;

  if (!isBase64Encoded) {
    return body;
  }
  return Buffer.from(body, 'base64').toString('utf8');
};

export const proxyEventToWebRequest = (
  event: APIGatewayProxyEvent
): Request => {
  const { httpMethod, path, domainName } = event.requestContext;

  const headers = new Headers();
  for (const [name, value] of Object.entries(event.headers ?? {})) {
    if (value != null) headers.append(name, value);
  }

  for (const [name, values] of Object.entries(event.multiValueHeaders ?? {})) {
    for (const value of values ?? []) {
      headers.append(name, value);
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

export const responseToProxyResult = async (
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

  return {
    statusCode: response.status,
    headers,
    multiValueHeaders,
    body: await response.text(),
    isBase64Encoded: false,
  };
};

export const handlerResultToProxyResult = async (
  response: HandlerResponse
): Promise<APIGatewayProxyResult> => {
  if (isAPIGatewayProxyResult(response)) {
    return response;
  }
  if (response instanceof Response) {
    return await responseToProxyResult(response);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(response),
    headers: { 'Content-Type': 'application/json' },
    isBase64Encoded: false,
  };
};
