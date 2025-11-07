# Component Dependencies

**Feature**: GitHub Issue #4516 - Data Validation in Event Handler  
**Date**: 2025-11-07

---

## Dependency Overview

The validation system has minimal dependencies, integrating cleanly with existing Event Handler infrastructure. The primary component (ValidationMiddleware) depends on the standard-schema package and existing Event Handler components.

---

## Dependency Matrix

| Component | Depends On | Used By | Dependency Type |
|-----------|------------|---------|-----------------|
| ValidationMiddleware | standard-schema, RequestContext, RouteHandler, Error types | Router (via middleware system) | Runtime |
| RequestValidationError | Error base class | ValidationMiddleware, Error Handler Registry | Runtime |
| ResponseValidationError | Error base class | ValidationMiddleware, Error Handler Registry | Runtime |
| Validation Types | Standard Schema types | ValidationMiddleware, Route configuration | Compile-time |

---

## Component Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Dependencies                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  standard-schema (npm package)                            │  │
│  │  - Validation abstraction for Zod, Valibot, ArkType      │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ uses
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Validation Components                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ValidationMiddleware                                     │  │
│  │  (packages/event-handler/src/rest/middleware/validation.ts)│
│  │                                                            │  │
│  │  Responsibilities:                                         │  │
│  │  - Parse validation configuration                         │  │
│  │  - Validate request components (body, headers, path, query)│
│  │  - Validate response components (body, headers)           │  │
│  │  - Construct validation errors                            │  │
│  └────────┬─────────────────────────────────┬────────────────┘  │
│           │                                  │                   │
│           │ throws                           │ uses              │
│           ▼                                  ▼                   │
│  ┌────────────────────┐          ┌──────────────────────────┐  │
│  │ RequestValidation  │          │  Validation Types         │  │
│  │ Error              │          │  (types.ts)               │  │
│  │ (errors.ts)        │          │  - ValidationConfig       │  │
│  │                    │          │  - RequestValidationConfig│  │
│  │ ResponseValidation │          │  - ResponseValidationConfig│
│  │ Error              │          │  - ValidatedRequest       │  │
│  │ (errors.ts)        │          │  - ValidatedResponse      │  │
│  └────────┬───────────┘          └──────────────────────────┘  │
└───────────┼─────────────────────────────────────────────────────┘
            │
            │ caught by
            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Existing Event Handler Components                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Router                                                    │  │
│  │  - Route registration with validation config              │  │
│  │  - Middleware chain execution                             │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│                            │ executes                            │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware System                                         │  │
│  │  - Pre-handler: ValidationMiddleware (request)            │  │
│  │  - Post-handler: ValidationMiddleware (response)          │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│                            │ on error                            │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Error Handler Registry                                    │  │
│  │  - Catches RequestValidationError (HTTP 422)              │  │
│  │  - Catches ResponseValidationError (HTTP 500)             │  │
│  │  - Formats error responses                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dependency Details

### ValidationMiddleware Dependencies

**External Dependencies**:
- `standard-schema` (npm package)
  - **Purpose**: Validation abstraction layer
  - **Usage**: Validate data against Standard Schema-compatible schemas
  - **Type**: Runtime dependency

**Internal Dependencies**:
- `RequestContext` (from Event Handler)
  - **Purpose**: Access request data (body, headers, path, query)
  - **Usage**: Extract data for validation
  - **Type**: Runtime dependency

- `RouteHandler` (from Event Handler)
  - **Purpose**: Execute route handler function
  - **Usage**: Call handler between request/response validation
  - **Type**: Runtime dependency

- `ValidationConfig` types (from types.ts)
  - **Purpose**: Type definitions for validation configuration
  - **Usage**: Type-safe configuration parsing
  - **Type**: Compile-time dependency

- `RequestValidationError`, `ResponseValidationError` (from errors.ts)
  - **Purpose**: Error classes for validation failures
  - **Usage**: Construct and throw validation errors
  - **Type**: Runtime dependency

---

### Validation Error Dependencies

**Internal Dependencies**:
- Event Handler error base class (if exists)
  - **Purpose**: Consistent error handling
  - **Usage**: Extend base error class
  - **Type**: Runtime dependency

**Used By**:
- `ValidationMiddleware`
  - **Purpose**: Throw validation errors
  - **Usage**: Construct errors with validation details

- `Error Handler Registry`
  - **Purpose**: Catch and handle validation errors
  - **Usage**: Format HTTP error responses

---

### Validation Types Dependencies

**External Dependencies**:
- `StandardSchema` types (from standard-schema package)
  - **Purpose**: Schema type definitions
  - **Usage**: Type validation configuration schemas
  - **Type**: Compile-time dependency

**Used By**:
- `ValidationMiddleware`
  - **Purpose**: Type-safe validation logic
  - **Usage**: Configuration parsing and validation

- Route configuration
  - **Purpose**: Type-safe route registration
  - **Usage**: Validation option typing

---

## Data Flow

### Request Validation Flow

```
1. Route Registration
   └─> Validation configuration provided
       └─> ValidationConfig<TReq, TRes>

2. Request Received
   └─> Router invokes middleware chain
       └─> ValidationMiddleware.validate()
           └─> parseValidationConfig()
               └─> Extract req schemas
           └─> validateRequestComponents()
               ├─> validateWithSchema(body)
               ├─> validateWithSchema(headers)
               ├─> validateWithSchema(path)
               └─> validateWithSchema(query)
                   └─> standard-schema.validate()
                       ├─> Success: Return ValidatedRequest<TReq>
                       └─> Failure: Throw RequestValidationError

3. Error Handling (if validation fails)
   └─> Error Handler Registry catches RequestValidationError
       └─> Format HTTP 422 response with error details
```

### Response Validation Flow

```
1. Route Handler Execution
   └─> Handler returns response data

2. Response Validation
   └─> ValidationMiddleware.validate() (post-handler)
       └─> validateResponseComponents()
           ├─> validateWithSchema(body)
           └─> validateWithSchema(headers)
               └─> standard-schema.validate()
                   ├─> Success: Return ValidatedResponse<TRes>
                   └─> Failure: Throw ResponseValidationError

3. Error Handling (if validation fails)
   └─> Error Handler Registry catches ResponseValidationError
       └─> Format HTTP 500 response (opaque error to client)
```

---

## Communication Patterns

### Synchronous Communication
All component interactions are synchronous:
- ValidationMiddleware validates synchronously (or awaits async validation)
- Error throwing is synchronous
- Error handling is synchronous

### No Asynchronous Messaging
- No event bus or message queue
- No pub/sub patterns
- Direct function calls only

### Error Propagation
- Validation errors propagate via exceptions
- Error Handler Registry catches exceptions
- Standard error handling flow

---

## Integration Points

### 1. Route Registration
**Integration**: ValidationMiddleware receives configuration from route options
```typescript
app.post('/route', handler, {
  validation: {
    req: { body: schema },
    res: { body: schema }
  }
});
```

### 2. Middleware System
**Integration**: ValidationMiddleware executes in middleware chain
- Pre-handler: Request validation
- Post-handler: Response validation

### 3. Error Handler Registry
**Integration**: Validation errors caught and handled
```typescript
app.errorHandler(RequestValidationError, (error) => {
  // Custom error handling
});
```

### 4. Standard Schema Package
**Integration**: Direct API usage for validation
```typescript
import { validate } from 'standard-schema';
const result = validate(schema, data);
```

---

## Dependency Management

### No Circular Dependencies
- ValidationMiddleware → Errors (one-way)
- ValidationMiddleware → Types (one-way)
- Errors → Types (one-way)
- No circular references

### Loose Coupling
- ValidationMiddleware depends on interfaces, not implementations
- Standard Schema provides abstraction over validation libraries
- Error Handler Registry uses error types, not middleware directly

### High Cohesion
- ValidationMiddleware contains all validation logic
- Errors contain only error representation
- Types contain only type definitions
- Clear separation of concerns

---

## External Package Dependencies

### Production Dependencies
- `standard-schema`: Required for validation abstraction

### Peer Dependencies
- `zod`: Optional (user choice)
- `valibot`: Optional (user choice)
- `arktype`: Optional (user choice)

**Note**: Users install their preferred validation library. ValidationMiddleware works with any Standard Schema-compatible library.

---

## Conclusion

The validation system has a clean dependency structure:
- ✅ Minimal external dependencies (standard-schema only)
- ✅ Clear integration with existing Event Handler components
- ✅ No circular dependencies
- ✅ Loose coupling, high cohesion
- ✅ Synchronous communication patterns
- ✅ Standard error propagation
