# API Documentation

## REST APIs

### Router Class Public API

#### Route Registration Methods
```typescript
// HTTP Method Registration
get(path: Path, handler: RouteHandler): void
get(path: Path, middleware: Middleware[], handler: RouteHandler): void
get(path: Path): MethodDecorator  // For decorator usage

post(path: Path, handler: RouteHandler): void
post(path: Path, middleware: Middleware[], handler: RouteHandler): void
post(path: Path): MethodDecorator

put(path: Path, handler: RouteHandler): void
patch(path: Path, handler: RouteHandler): void
delete(path: Path, handler: RouteHandler): void
head(path: Path, handler: RouteHandler): void
options(path: Path, handler: RouteHandler): void
```

#### Generic Route Registration
```typescript
route(handler: RouteHandler, options: RestRouteOptions): void

interface RestRouteOptions {
  method: HttpMethod | HttpMethod[]
  path: Path
  middleware?: Middleware[]
}
```

#### Middleware Registration
```typescript
use(middleware: Middleware): void

type Middleware = (args: {
  reqCtx: RequestContext
  next: NextFunction
}) => Promise<HandlerResponse | void>
```

#### Error Handler Registration
```typescript
errorHandler<T extends Error>(
  errorType: ErrorConstructor<T> | ErrorConstructor<T>[],
  handler: ErrorHandler<T>
): void

notFound(handler: ErrorHandler<NotFoundError>): void
methodNotAllowed(handler: ErrorHandler<MethodNotAllowedError>): void
```

#### Request Resolution
```typescript
// Standard resolution (returns APIGatewayProxyResult)
resolve(
  event: unknown,
  context: Context,
  options?: ResolveOptions
): Promise<APIGatewayProxyResult>

// Streaming resolution (for Lambda response streaming)
resolveStream(
  event: unknown,
  context: Context,
  options: ResolveStreamOptions
): Promise<void>
```

#### Router Composition
```typescript
includeRouter(router: Router, options?: { prefix: Path }): void
```

### RequestContext Interface
```typescript
interface RequestContext {
  req: Request              // Standard web Request object
  event: APIGatewayProxyEvent  // Original Lambda event
  context: Context          // Lambda context
  res: Response            // Standard web Response object
  params: Record<string, string>  // Path parameters
}
```

### Route Handler Interface
```typescript
type RouteHandler<TReturn = HandlerResponse> = (
  reqCtx: RequestContext
) => Promise<TReturn> | TReturn

type HandlerResponse = 
  | Response                    // Standard web Response
  | JSONObject                  // Plain JSON object
  | ExtendedAPIGatewayProxyResult  // Lambda proxy result with streaming
```

### Error Handler Interface
```typescript
type ErrorHandler<T extends Error = Error> = (
  error: T,
  reqCtx: RequestContext
) => Promise<HandlerResponse>
```

## Built-in Middleware APIs

### CORS Middleware
```typescript
cors(options?: CorsOptions): Middleware

interface CorsOptions {
  origin?: string | string[] | ((origin: string, reqCtx: RequestContext) => boolean)
  allowMethods?: HttpMethod[]
  allowHeaders?: string[]
  exposeHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}
```

### Compression Middleware
```typescript
compress(options?: CompressOptions): Middleware

interface CompressOptions {
  threshold?: number        // Minimum response size to compress
  level?: number           // Compression level (1-9)
  chunkSize?: number       // Chunk size for streaming
}
```

## Internal APIs

### RouteHandlerRegistry
```typescript
class RouteHandlerRegistry {
  register(route: Route): void
  resolve(method: HttpMethod, path: string): RestRouteHandlerOptions | null
  merge(registry: RouteHandlerRegistry, options?: { prefix: Path }): void
}
```

### ErrorHandlerRegistry
```typescript
class ErrorHandlerRegistry {
  register<T extends Error>(
    errorType: ErrorConstructor<T> | ErrorConstructor<T>[],
    handler: ErrorHandler<T>
  ): void
  resolve(error: Error): ErrorHandler | null
  merge(registry: ErrorHandlerRegistry): void
}
```

### Event Converters
```typescript
// Convert Lambda event to web Request
proxyEventToWebRequest(event: APIGatewayProxyEvent): Request

// Convert handler response to Lambda proxy result
handlerResultToProxyResult(result: HandlerResponse): APIGatewayProxyResult

// Convert handler response to web Response
handlerResultToWebResponse(result: HandlerResponse): Response

// Convert web headers to API Gateway format
webHeadersToApiGatewayV1Headers(headers: Headers): {
  headers: Record<string, string>
  multiValueHeaders: Record<string, string[]>
}
```

## Data Models

### Route Model
```typescript
class Route {
  constructor(
    public method: HttpMethod,
    public path: Path,
    public handler: RouteHandler,
    public middleware: Middleware[] = []
  )
}
```

### Compiled Route Model
```typescript
interface CompiledRoute {
  path: Path
  regex: RegExp
  paramNames: string[]
  isDynamic: boolean
}

type DynamicRoute = Route & CompiledRoute
```

### HTTP Constants
```typescript
enum HttpVerbs {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

enum HttpStatusCodes {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  INTERNAL_SERVER_ERROR = 500
}
```

### Error Classes
```typescript
class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  )
}

class NotFoundError extends HttpError {
  constructor(message = 'Not Found')
}

class MethodNotAllowedError extends HttpError {
  constructor(message = 'Method Not Allowed')
}

class InternalServerError extends HttpError {
  constructor(message = 'Internal Server Error')
}
```

## Type Definitions

### Path Types
```typescript
type Path = `/${string}` | RegExp
type HttpMethod = keyof typeof HttpVerbs
type HttpStatusCode = (typeof HttpStatusCodes)[keyof typeof HttpStatusCodes]
```

### Router Options
```typescript
interface RestRouterOptions {
  logger?: GenericLogger
  prefix?: Path
}
```

### Resolve Options
```typescript
interface ResolveOptions {
  scope?: unknown  // Binding scope for handler execution
}

interface ResolveStreamOptions extends ResolveOptions {
  responseStream: ResponseStream  // Lambda response stream
}
```

## Validation Integration Points

Based on the analysis for Issue #4516, the following are key integration points where validation could be added:

### Request Validation Points
1. **Pre-middleware**: Before any middleware execution
2. **Post-middleware**: After middleware but before handler
3. **Handler wrapper**: Wrap the handler execution
4. **Route registration**: Validate at route definition time

### Response Validation Points
1. **Handler response**: Validate handler return value
2. **Pre-conversion**: Before converting to Lambda response format
3. **Error responses**: Validate error handler responses

### Type Integration Points
1. **RequestContext enhancement**: Add validated request body/params
2. **Handler signature**: Strongly type handler parameters
3. **Middleware signature**: Type-safe validation middleware
4. **Error handling**: Validation-specific error types
