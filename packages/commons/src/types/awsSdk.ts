/**
 * @internal
 * Minimal interface for an AWS SDK v3 client
 */
interface SdkClient {
  send: (args: unknown) => Promise<unknown>;
  config: {
    serviceId: string;
  };
  middlewareStack: {
    identify: () => string[];
    addRelativeTo: (middleware: unknown, options: unknown) => void;
  };
}

/**
 * @internal
 * Minimal type for the arguments passed to a middleware function
 */
type MiddlewareArgsLike = { request: { headers: { [key: string]: string } } };

export type { SdkClient, MiddlewareArgsLike };
