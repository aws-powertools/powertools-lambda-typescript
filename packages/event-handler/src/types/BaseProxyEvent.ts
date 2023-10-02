import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  Headers,
  JSONData,
  MultiValueHeaders,
  QueryStringParameters,
  MultiValueQueryStringParameters,
} from './common';

/**
 * Base model for an HTTP Gateway Proxy event
 *
 * @category Model
 */
interface HTTPBaseProxyEvent {
  /** HTTP URL path */
  path?: string;

  /** JSON stringified Request body */
  body: string | null;

  /** HTTP Headers */
  headers: Headers;

  /** HTTP Multi-value headers */
  multiValueHeaders?: MultiValueHeaders;

  /** HTTP Request body transformed after parsing based on a schema */
  parsedBody?: unknown;

  /** HTTP MEthod */
  httpMethod: string;

  /** base-64 encoded indicator */
  isBase64Encoded: boolean;

  /** HTTP Query parameters */
  queryStringParameters?: QueryStringParameters;

  /** HTTP multi-value Query parameter */
  multiValueQueryStringParameters?: MultiValueQueryStringParameters;
}

/** Base type for HTTP Proxy event */
type BaseProxyEvent = HTTPBaseProxyEvent | APIGatewayProxyEvent;

/**
 * Model for a HTTP Proxy event
 *
 * @category Model
 */
abstract class HTTPProxyEvent implements HTTPBaseProxyEvent {
  public body: string | null = null;
  public headers: Headers = {};
  public httpMethod = '';
  public isBase64Encoded = false;
  public jsonData?: JSONData;
  public multiValueHeaders?: MultiValueHeaders;
  public multiValueQueryStringParameters?: MultiValueQueryStringParameters;
  public queryStringParameters?: QueryStringParameters;
}

export { BaseProxyEvent, HTTPBaseProxyEvent, HTTPProxyEvent };
