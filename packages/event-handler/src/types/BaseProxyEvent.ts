import { Headers, JSONData, QueryParameters, OptionalString } from './common';
import { Cookie } from './Cookie';

interface BaseHeadersSerializer {
  serialize: (headers: Headers, cookies: Cookie[]) => JSONData
}

abstract class BaseProxyEvent {
  public abstract body?: string;
  public abstract headers: Headers;
  public abstract httpMethod: string;
  public abstract isBase64Encoded?: boolean;
  public abstract jsonData: JSONData;
  public abstract path: string;
  public abstract queryStringParameters?: QueryParameters;

  public decodedBody(): OptionalString {
    if (this.isBase64Encoded && this.body) {
      return Buffer.from(this.body, 'base64').toString('utf8');
    }

    return this.body;
  }

  public abstract headerSerializer(): BaseHeadersSerializer;

  public headerValue(
    name: string,
    defaultValue?: OptionalString,
    caseSensitive: boolean = false
  ): OptionalString {
    return this.headers.has(name)
      ? caseSensitive
        ? (this.headers.get(name) as string)
        : (this.headers.get(name.toLowerCase()) as string)
      : defaultValue;
  }

  public jsonBody(): JSONData {
    if (this.jsonData) {
      this.jsonData = JSON.parse(this.decodedBody() || '{}');
    }

    return this.jsonData;
  }

  public queryStringValue(
    name: string,
    defaultValue?: OptionalString
  ): OptionalString {
    return this.queryStringParameters?.has(name)
      ? (this.queryStringParameters.get(name) as string)
      : defaultValue;
  }
}

export { BaseProxyEvent, BaseHeadersSerializer };
