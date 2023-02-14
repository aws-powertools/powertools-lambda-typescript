type HeaderNames = Set<string>;
type Headers = Map<string, string | string[]>;
type QueryParameters = Map<string, string | string[]>;
type CallbackFunction = (...args: string[]) => string;
type PathPattern = RegExp;
type Body = string | Buffer | undefined;
type OptionalString = string | undefined;
type JSONData = Record<string, unknown>;
type Context = Map<string, unknown>;
type HTTPMethod = string | string[];

export {
  HeaderNames,
  CallbackFunction,
  PathPattern,
  Headers,
  QueryParameters,
  Body,
  OptionalString,
  JSONData,
  Context,
  HTTPMethod,
};
