import { Headers } from './common';

/**
 * CORS Configuration
 *
 * @category Model
 */
class CORSConfig {
  private readonly REQUIRED_HEADERS = [
    'Authorization',
    'Content-Type',
    'X-Amz-Date',
    'X-Api-Key',
    'X-Amz-Security-Token',
  ];

  /**
   * Create CORS Configuration
   * @param allowOrigin comma separated list of HTTP origins to allow (`Access-Control-Allow-Origin`). Defaults to "*".
   * @param allowHeaders list of headers to allow (`Access-Control-Allow-Headers`)
   * @param exposeHeaders list of headers to allow (`Access-Control-Expose-Headers`)
   * @param max_age time in seconds until which the response is treated as fresh (`max-age`)
   * @param allowCredentials sets the HTTP header `Access-Control-Allow-Credentials`
   */
  public constructor(
    public allowOrigin: string = '*',
    public allowHeaders: string[] = [],
    public exposeHeaders: string[] = [],
    public max_age?: number,
    public allowCredentials: boolean = false
  ) {
    if (allowHeaders.includes('*')) {
      this.allowHeaders = ['*'];
    } else {
      this.allowHeaders = [
        ...new Set([...this.REQUIRED_HEADERS, ...allowHeaders]),
      ];
    }
  }

  /**
   * Generates the CORS headers based on the CORS configuration
   *
   * @returns CORS Headers
   *
   */
  public headers(): Headers {
    const headers: Headers = {
      'Access-Control-Allow-Origin': this.allowOrigin,
      'Access-Control-Allow-Headers': this.allowHeaders.join(','),
    };

    if (this.exposeHeaders.length > 0) {
      headers['Access-Control-Expose-Headers'] = this.exposeHeaders.join(',');
    }

    if (this.max_age) {
      headers['Access-Control-Max-Age'] = this.max_age.toString();
    }

    if (this.allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
  }
}

export { CORSConfig };
