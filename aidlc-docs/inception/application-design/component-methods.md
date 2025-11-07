# Component Methods

**Feature**: GitHub Issue #4516 - Data Validation in Event Handler  
**Date**: 2025-11-07

**Note**: This document defines method signatures and high-level purposes. Detailed business logic and implementation details will be defined in the Functional Design phase (CONSTRUCTION).

---

## ValidationMiddleware Component

**Location**: `packages/event-handler/src/rest/middleware/validation.ts`

### Method: `validation()` (Middleware Factory)

**Signature**:
```typescript
function validation<TReq, TRes>(
  config: ValidationConfig<TReq, TRes>
): Middleware
```

**Purpose**: Factory function that validates configuration once and returns a middleware function for request/response validation.

**Parameters**:
- `config`: Validation configuration containing req/res schemas

**Returns**: Middleware function that validates requests/responses

**High-Level Flow**:
1. Validate configuration structure (once, at registration time)
2. Parse and normalize req/res schemas (once, at registration time)
3. Return middleware function that:
   - Validates request components (at request time)
   - Executes route handler
   - Validates response components (at request time)

**Error Handling**: Throws configuration error if invalid structure at registration time; throws RequestValidationError or ResponseValidationError at request time

---

### Internal Method: `validateRequest()`

**Signature**:
```typescript
function validateRequest<TReq>(
  schemas: ParsedRequestSchemas<TReq>,
  reqCtx: RequestContext
): ValidatedRequest<TReq>
```

**Purpose**: Validate request components against parsed schemas.

**Parameters**:
- `schemas`: Pre-parsed request schemas (body, headers, path, query)
- `reqCtx`: Request context containing raw request data

**Returns**: Validated request data with inferred types

**High-Level Flow**:
1. Validate body if schema provided
2. Validate headers if schema provided
3. Validate path parameters if schema provided
4. Validate query strings if schema provided
5. Return validated data structure

**Error Handling**: Throws RequestValidationError with component-specific details

---

### Internal Method: `validateResponse()`

**Signature**:
```typescript
function validateResponse<TRes>(
  schemas: ParsedResponseSchemas<TRes>,
  response: unknown
): ValidatedResponse<TRes>
```

**Purpose**: Validate response components against parsed schemas.

**Parameters**:
- `schemas`: Pre-parsed response schemas (body, headers)
- `response`: Handler return value

**Returns**: Validated response data with inferred types

**High-Level Flow**:
1. Validate response body if schema provided
2. Validate response headers if schema provided
3. Return validated response structure

**Error Handling**: Throws ResponseValidationError with component-specific details

---

## Validation Error Classes

**Location**: `packages/event-handler/src/rest/errors.ts`

### Class: `RequestValidationError`

**Extends**: `Error` (or existing Event Handler error base class)

**Constructor**:
```typescript
constructor(
  message: string,
  component: ValidationComponent,
  errors: ValidationErrorDetail[]
)
```

**Properties**:
- `statusCode`: 422 (Unprocessable Entity)
- `component`: Which request component failed ('body', 'headers', 'path', 'query')
- `errors`: Array of validation error details (field, message, value)

**Purpose**: Represents request validation failures with detailed error information.

---

### Class: `ResponseValidationError`

**Extends**: `Error` (or existing Event Handler error base class)

**Constructor**:
```typescript
constructor(
  message: string,
  component: ValidationComponent,
  errors: ValidationErrorDetail[]
)
```

**Properties**:
- `statusCode`: 500 (Internal Server Error)
- `component`: Which response component failed ('body', 'headers')
- `errors`: Array of validation error details (field, message, value)

**Purpose**: Represents response validation failures indicating handler bugs.

---

## Type Definitions

**Location**: `packages/event-handler/src/rest/types.ts`

### Type: `ValidationConfig<TReq, TRes>`

**Purpose**: Configuration structure for route validation.

**Structure**:
```typescript
type ValidationConfig<TReq, TRes> = {
  req?: RequestValidationConfig<TReq>;
  res?: ResponseValidationConfig<TRes>;
}
```

---

### Type: `RequestValidationConfig<T>`

**Purpose**: Request component validation schemas.

**Structure**:
```typescript
type RequestValidationConfig<T> = {
  body?: StandardSchema<T['body']>;
  headers?: StandardSchema<T['headers']>;
  path?: StandardSchema<T['path']>;
  query?: StandardSchema<T['query']>;
}
```

---

### Type: `ResponseValidationConfig<T>`

**Purpose**: Response component validation schemas.

**Structure**:
```typescript
type ResponseValidationConfig<T> = {
  body?: StandardSchema<T['body']>;
  headers?: StandardSchema<T['headers']>;
}
```

---

### Type: `ValidatedRequest<T>`

**Purpose**: Validated request data with inferred types.

**Structure**:
```typescript
type ValidatedRequest<T> = {
  body?: T['body'];
  headers?: T['headers'];
  path?: T['path'];
  query?: T['query'];
}
```

---

### Type: `ValidatedResponse<T>`

**Purpose**: Validated response data with inferred types.

**Structure**:
```typescript
type ValidatedResponse<T> = {
  body?: T['body'];
  headers?: T['headers'];
}
```

---

### Type: `ValidationComponent`

**Purpose**: Enum of validation component types.

**Structure**:
```typescript
type ValidationComponent = 'body' | 'headers' | 'path' | 'query';
```

---

### Type: `ValidationErrorDetail`

**Purpose**: Individual validation error information.

**Structure**:
```typescript
type ValidationErrorDetail = {
  field: string;
  message: string;
  value?: unknown;
}
```

---

## Method Interaction Flow

```
Route Registration (once)
    │
    ├─> validation(config) [Middleware Factory]
    │       │
    │       ├─> Validate config structure
    │       ├─> Parse req/res schemas
    │       │
    │       └─> Return middleware function
    │
    └─> Middleware registered

Request Time (per request)
    │
    ├─> Middleware function executes
    │       │
    │       ├─> validateRequest(schemas, reqCtx)
    │       │       └─> Validate body, headers, path, query using standard-schema
    │       │
    │       ├─> Execute Route Handler
    │       │
    │       └─> validateResponse(schemas, response)
    │               └─> Validate body, headers using standard-schema
    │
    └─> Error Handler Registry
            ├─> RequestValidationError (HTTP 422)
            └─> ResponseValidationError (HTTP 500)
```

---

## Notes

1. **Middleware Factory Pattern**: Configuration validation and parsing happens once at registration time, not per request.

2. **Consolidated Logic**: Validation logic consolidated into minimal methods without unnecessary abstractions:
   - `validation()`: Factory that parses config once
   - `validateRequest()`: Request validation
   - `validateResponse()`: Response validation
   - Direct use of standard-schema for actual validation

3. **No Tiny Abstractions**: Removed `validateWithSchema()` and `parseValidationConfig()` as separate methods - logic integrated directly into factory and validation methods.

4. **Type Inference**: TypeScript generics enable automatic type inference from schemas without custom utilities.

5. **Standard Schema Integration**: Direct use of standard-schema package API for validation.

6. **Detailed Logic**: Business rules, validation algorithms, and error formatting details will be specified in Functional Design phase.
