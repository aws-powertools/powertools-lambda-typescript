import type { APIGatewayProxyEvent } from 'aws-lambda';

const createBody = (body: string | null, isBase64Encoded: boolean) => {
  if (body === null) return null;

  if (!isBase64Encoded) {
    return body;
  }
  return Buffer.from(body, 'base64').toString('utf8');
};

export const proxyEventToWebRequest = (event: APIGatewayProxyEvent) => {
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
  const protocol = headers.get('X-Forwarded-Proto') ?? 'http';

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
}
