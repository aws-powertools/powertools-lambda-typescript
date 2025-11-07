# Domain Entities - Validation Middleware

**Unit**: Event Handler Validation  
**Date**: 2025-11-07

---

## Entity Overview

The validation middleware domain consists of configuration entities, validated data entities, and error entities. All entities are simple data structures with no behavior.

---

## Configuration Entities

### ValidationConfig<TReq, TRes>

**Purpose**: Top-level validation configuration for a route

**Structure**:
```typescript
{
  req?: RequestValidationConfig<TReq>
  res?: ResponseValidationConfig<TRes>
}
```

**Properties**:
- `req`: Optional request validation configuration
- `res`: Optional response validation configuration

**Constraints**:
- At least one of req or res should be provided (but not enforced)
- Both can be undefined (middleware passes through)

**Example**:
```typescript
{
  req: {
    body: zodSchema,
    headers: zodSchema
  },
  res: {
    body: zodSchema
  }
}
```

---

### RequestValidationConfig<T>

**Purpose**: Request component validation schemas

**Structure**:
```typescript
{
  body?: StandardSchema<T['body']>
  headers?: StandardSchema<T['headers']>
  path?: StandardSchema<T['path']>
  query?: StandardSchema<T['query']>
}
```

**Properties**:
- `body`: Optional schema for request body
- `headers`: Optional schema for request headers
- `path`: Optional schema for path parameters
- `query`: Optional schema for query strings

**Constraints**:
- All properties optional
- Schemas must be Standard Schema-compatible

**Example**:
```typescript
{
  body: z.object({ title: z.string() }),
  headers: z.object({ authorization: z.string() }),
  path: z.object({ todoId: z.string() }),
  query: z.object({ includeDetails: z.boolean() })
}
```

---

### ResponseValidationConfig<T>

**Purpose**: Response component validation schemas

**Structure**:
```typescript
{
  body?: StandardSchema<T['body']>
  headers?: StandardSchema<T['headers']>
}
```

**Properties**:
- `body`: Optional schema for response body
- `headers`: Optional schema for response headers

**Constraints**:
- All properties optional
- Schemas must be Standard Schema-compatible

**Example**:
```typescript
{
  body: z.object({ success: z.boolean() }),
  headers: z.object({ 'x-request-id': z.string() })
}
```

---

## Validated Data Entities

### ValidatedRequest<T>

**Purpose**: Validated request data with inferred types

**Structure**:
```typescript
{
  body?: T['body']
  headers?: T['headers']
  path?: T['path']
  query?: T['query']
}
```

**Properties**:
- `body`: Validated request body (if schema provided)
- `headers`: Validated request headers (if schema provided)
- `path`: Validated path parameters (if schema provided)
- `query`: Validated query strings (if schema provided)

**Constraints**:
- Properties present only if corresponding schema was provided
- Types inferred from schemas via TypeScript generics

**Example**:
```typescript
{
  body: { title: "Buy milk" },
  headers: { authorization: "Bearer token123" },
  path: { todoId: "123" },
  query: { includeDetails: true }
}
```

---

### ValidatedResponse<T>

**Purpose**: Validated response data with inferred types

**Structure**:
```typescript
{
  body?: T['body']
  headers?: T['headers']
}
```

**Properties**:
- `body`: Validated response body (if schema provided)
- `headers`: Validated response headers (if schema provided)

**Constraints**:
- Properties present only if corresponding schema was provided
- Types inferred from schemas via TypeScript generics

**Example**:
```typescript
{
  body: { success: true },
  headers: { 'x-request-id': 'req-123' }
}
```

---

## Error Entities

### ValidationError

**Purpose**: Error thrown by standard-schema on validation failure

**Structure**: Defined by standard-schema library (Zod, Valibot, ArkType)

**Properties** (library-specific):
- Error message
- Field paths
- Validation details
- Actual values

**Constraints**:
- Format varies by schema library
- Middleware does not transform error
- Router's error handler formats for HTTP response

**Example** (Zod):
```typescript
{
  name: "ZodError",
  issues: [
    {
      path: ["body", "title"],
      message: "Required",
      code: "invalid_type"
    }
  ]
}
```

---

### RequestValidationError

**Purpose**: Error class for request validation failures (HTTP 422)

**Structure**:
```typescript
{
  name: "RequestValidationError"
  message: string
  component: ValidationComponent
  originalError: ValidationError
  statusCode: 422
}
```

**Properties**:
- `name`: Error class name
- `message`: Human-readable error message
- `component`: Which component failed ('body', 'headers', 'path', 'query')
- `originalError`: Original error from standard-schema
- `statusCode`: HTTP 422

**Constraints**:
- Wraps standard-schema error
- Includes component context
- Used by Router's error handler

---

### ResponseValidationError

**Purpose**: Error class for response validation failures (HTTP 500)

**Structure**:
```typescript
{
  name: "ResponseValidationError"
  message: string
  component: ValidationComponent
  originalError: ValidationError
  statusCode: 500
}
```

**Properties**:
- `name`: Error class name
- `message`: Human-readable error message
- `component`: Which component failed ('body', 'headers')
- `originalError`: Original error from standard-schema
- `statusCode`: HTTP 500

**Constraints**:
- Wraps standard-schema error
- Includes component context
- Used by Router's error handler

---

## Supporting Types

### ValidationComponent

**Purpose**: Enum of validation component types

**Structure**:
```typescript
type ValidationComponent = 'body' | 'headers' | 'path' | 'query'
```

**Values**:
- `'body'`: Request or response body
- `'headers'`: Request or response headers
- `'path'`: Path parameters
- `'query'`: Query strings

**Usage**: Identify which component failed validation

---

### StandardSchema<T>

**Purpose**: Standard Schema-compatible schema type

**Structure**: Defined by standard-schema specification

**Constraints**:
- Must implement Standard Schema interface
- Supported libraries: Zod, Valibot, ArkType

**Example**:
```typescript
// Zod
z.object({ title: z.string() })

// Valibot
v.object({ title: v.string() })

// ArkType
type({ title: 'string' })
```

---

## Entity Relationships

```
ValidationConfig
    ├─> RequestValidationConfig
    │       ├─> body: StandardSchema
    │       ├─> headers: StandardSchema
    │       ├─> path: StandardSchema
    │       └─> query: StandardSchema
    └─> ResponseValidationConfig
            ├─> body: StandardSchema
            └─> headers: StandardSchema

ValidatedRequest
    ├─> body: T['body']
    ├─> headers: T['headers']
    ├─> path: T['path']
    └─> query: T['query']

ValidatedResponse
    ├─> body: T['body']
    └─> headers: T['headers']

RequestValidationError
    ├─> component: ValidationComponent
    └─> originalError: ValidationError

ResponseValidationError
    ├─> component: ValidationComponent
    └─> originalError: ValidationError
```

---

## Entity Lifecycle

### Configuration Entities
1. **Created**: At route registration time by user
2. **Parsed**: At registration time by validation factory
3. **Stored**: In middleware closure
4. **Used**: At request time for validation

### Validated Data Entities
1. **Created**: At request time after successful validation
2. **Passed**: To route handler (request) or returned (response)
3. **Destroyed**: After request completes

### Error Entities
1. **Created**: At validation failure time by standard-schema
2. **Wrapped**: In RequestValidationError or ResponseValidationError
3. **Thrown**: Propagated to Router's error handler
4. **Formatted**: By error handler into HTTP response

---

## Entity Invariants

### ValidationConfig
- At least one of req or res typically provided (not enforced)
- Schemas are Standard Schema-compatible (enforced by TypeScript)

### RequestValidationConfig / ResponseValidationConfig
- All properties optional
- Schemas must be Standard Schema-compatible

### ValidatedRequest / ValidatedResponse
- Properties present only if schema was provided
- Types match schema definitions
- Data has been validated by schema library

### Error Entities
- Always include component context
- Always wrap original schema library error
- Status code matches error type (422 for request, 500 for response)

---

## Entity Constraints Summary

| Entity | Required Properties | Optional Properties | Type Constraints |
|--------|-------------------|-------------------|------------------|
| ValidationConfig | None | req, res | Standard Schema types |
| RequestValidationConfig | None | body, headers, path, query | Standard Schema types |
| ResponseValidationConfig | None | body, headers | Standard Schema types |
| ValidatedRequest | None | body, headers, path, query | Inferred from schemas |
| ValidatedResponse | None | body, headers | Inferred from schemas |
| RequestValidationError | name, message, component, statusCode | originalError | component: ValidationComponent |
| ResponseValidationError | name, message, component, statusCode | originalError | component: ValidationComponent |

---

## Entity Usage Examples

### Complete Validation Configuration
```typescript
const config: ValidationConfig = {
  req: {
    body: z.object({ title: z.string() }),
    headers: z.object({ authorization: z.string() }),
    path: z.object({ todoId: z.string() }),
    query: z.object({ includeDetails: z.boolean() })
  },
  res: {
    body: z.object({ success: z.boolean() }),
    headers: z.object({ 'x-request-id': z.string() })
  }
}
```

### Minimal Validation Configuration
```typescript
const config: ValidationConfig = {
  req: {
    body: z.object({ title: z.string() })
  }
}
```

### Validated Request Data
```typescript
const validatedReq: ValidatedRequest = {
  body: { title: "Buy milk" },
  headers: { authorization: "Bearer token123" },
  path: { todoId: "123" },
  query: { includeDetails: true }
}
```

### Request Validation Error
```typescript
const error: RequestValidationError = {
  name: "RequestValidationError",
  message: "Request body validation failed",
  component: "body",
  originalError: zodError,
  statusCode: 422
}
```
