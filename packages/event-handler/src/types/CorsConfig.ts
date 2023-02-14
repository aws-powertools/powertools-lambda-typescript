import { HeaderNames, Headers } from './common';

class CORSConfig {
  protected _REQUIRED_HEADERS = [
    'Authorization',
    'Content-Type',
    'X-Amz-Date',
    'X-Api-Key',
    'X-Amz-Security-Token',
  ];

  public constructor(
    private allowOrigin: string = '*',
    private allowHeaders?: HeaderNames,
    private exposeHeaders?: HeaderNames,
    private max_age?: number,
    private allowCredentials: boolean = false
  ) {
    this.allowOrigin = allowOrigin;
    this.allowHeaders = new Set(
      ...(allowHeaders || []),
      ...this._REQUIRED_HEADERS
    );
    this.exposeHeaders = exposeHeaders;
    this.max_age = max_age;
    this.allowCredentials = allowCredentials;
  }

  public headers(): Headers {
    const headers = new Map<string, string>([
      [ 'Access-Control-Allow-Origin', this.allowOrigin ],
      [
        'Access-Control-Allow-Headers',
        Array.from(this.allowHeaders || []).join(','),
      ],
    ]);

    if (this.exposeHeaders) {
      headers.set(
        'Access-Control-Expose-Headers',
        Array.from(this.exposeHeaders).join(',')
      );
    }

    if (this.max_age) {
      headers.set('Access-Control-Max-Age', this.max_age.toString());
    }

    if (this.allowCredentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return headers;
  }
}

export { CORSConfig };
