import { Body, Headers } from './common';
import { Cookie } from './Cookie';

class Response {
  public constructor(
    public statusCode: number,
    public contentType?: string,
    public body?: Body,
    public headers?: Headers,
    public cookies?: Cookie[],
    public base64Encoded?: boolean
  ) {
    this.statusCode = statusCode;
    this.body = body;
    this.base64Encoded = base64Encoded;
    this.headers = headers ? headers : new Map();
    this.cookies = cookies;
    if (contentType) {
      this.headers?.set('Content-Type', contentType);
    }
  }
}

export { Body, Response };
