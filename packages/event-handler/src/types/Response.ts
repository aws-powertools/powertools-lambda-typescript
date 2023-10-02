import { Body, Headers } from './common';

/**
 * Response model Interface
 */
interface ResponseInterface {
  body: Body;
  statusCode: number;
  headers: Headers;
  contentType?: string;
}

/**
 * Standard model for HTTP Proxy response
 */
class Response {
  public constructor(
    public statusCode: number,
    public contentType?: string,
    public body?: Body,
    public headers: Headers = {},
    public cookies: string[] = [],
    public base64Encoded: boolean = false
  ) {
    if (contentType) {
      this.headers['Content-Type'] = contentType;
    }
  }
}

export { Body, Response, ResponseInterface };
