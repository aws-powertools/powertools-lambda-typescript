import { APIGatewayProxyEvent } from 'aws-lambda';

type ArgsDict = Record<string, unknown> | undefined;

type Headers = Record<string, string | undefined>;

type MultiValueHeaders = Record<string, string[] | undefined>;

type PathParameters = Record<string, string | undefined>;

type QueryStringParameters = Record<string, string | undefined>;

type MultiValueQueryStringParameters = Record<string, string[] | undefined>;

type Path = string;

type PathPattern = RegExp;

type Body = string | Buffer | undefined;

type OptionalString = string | undefined | null;

type JSONData = Record<string, unknown> | undefined;

type ContentType =
  | 'text/html'
  | 'text/plain'
  | 'application/xml'
  | 'application/json'
  | 'application/xhtml+xml';

type Context = Map<string, unknown>;

type HTTPMethod = string | string[];

type BaseAPIGatewayProxyEvent = Omit<APIGatewayProxyEvent, 'requestContext'>;

type AsyncFunction<T = unknown> = (
  ...args: unknown[]
) => Promise<ReturnType<() => T>>;

export {
  ArgsDict,
  AsyncFunction,
  BaseAPIGatewayProxyEvent,
  Body,
  ContentType,
  Context,
  HTTPMethod,
  Headers,
  JSONData,
  MultiValueHeaders,
  MultiValueQueryStringParameters,
  OptionalString,
  Path,
  PathParameters,
  PathPattern,
  QueryStringParameters,
};
