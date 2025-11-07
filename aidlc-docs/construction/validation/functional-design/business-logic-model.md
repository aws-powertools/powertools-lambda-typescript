# Business Logic Model - Validation Middleware

**Unit**: Event Handler Validation  
**Date**: 2025-11-07

---

## Overview

The validation middleware uses a factory pattern that delegates validation logic to the standard-schema library. The design is minimal, trusting user configuration and letting the schema library handle type coercion, error details, and validation logic.

---

## Validation Factory Logic

### Factory Initialization (Registration Time)

**Function**: `validation(config)`

**Input**: `ValidationConfig<TReq, TRes>`

**Logic**:
1. Accept configuration without validation (trust user input)
2. Extract `req` schemas (body, headers, path, query) if provided
3. Extract `res` schemas (body, headers) if provided
4. Return middleware function with closured schemas

**Output**: Middleware function

**Pseudocode**:
```
function validation(config):
    reqSchemas = config.req || {}
    resSchemas = config.res || {}
    
    return async function middleware(reqCtx, handler):
        // Request validation
        if reqSchemas has any schemas:
            validatedReq = validateRequest(reqSchemas, reqCtx)
        
        // Execute handler
        response = await handler(validatedReq)
        
        // Response validation
        if resSchemas has any schemas:
            validatedRes = validateResponse(resSchemas, response)
        
        return validatedRes
```

**Key Characteristics**:
- No configuration validation (trust user)
- Parse schemas once at registration
- Closure captures schemas for request-time use
- Minimal overhead

---

## Request Validation Logic

### Request Validation Flow

**Function**: `validateRequest(schemas, reqCtx)`

**Input**:
- `schemas`: Parsed request schemas (body, headers, path, query)
- `reqCtx`: Request context from Event Handler

**Logic**:
1. Extract request data from reqCtx (assume already parsed)
2. For each configured schema (body, headers, path, query):
   - Get data for that component
   - Call standard-schema validation
   - Let standard-schema throw error on failure (fail fast)
   - Collect validated data
3. Return validated request object

**Output**: Validated request data with inferred types

**Pseudocode**:
```
function validateRequest(schemas, reqCtx):
    validatedData = {}
    
    if schemas.body exists:
        data = reqCtx.body  // Assume already parsed
        validatedData.body = validate(schemas.body, data)  // Throws on error
    
    if schemas.headers exists:
        data = reqCtx.headers
        validatedData.headers = validate(schemas.headers, data)  // Throws on error
    
    if schemas.path exists:
        data = reqCtx.pathParameters
        validatedData.path = validate(schemas.path, data)  // Throws on error
    
    if schemas.query exists:
        data = reqCtx.queryStringParameters
        validatedData.query = validate(schemas.query, data)  // Throws on error
    
    return validatedData
```

**Error Handling**:
- standard-schema throws error on validation failure
- Error propagates to Router's error handler
- Fail fast: first validation error stops processing

**Key Characteristics**:
- Assume body already parsed by Event Handler
- Validate undefined as-is (schema must allow undefined)
- Let schema library handle type coercion
- Let schema library handle error details
- Fail fast on first error

---

## Response Validation Logic

### Response Validation Flow

**Function**: `validateResponse(schemas, response)`

**Input**:
- `schemas`: Parsed response schemas (body, headers)
- `response`: Handler return value

**Logic**:
1. For each configured schema (body, headers):
   - Get data for that component
   - Call standard-schema validation
   - Let standard-schema throw error on failure (fail fast)
   - Collect validated data
2. Return validated response object

**Output**: Validated response data with inferred types

**Pseudocode**:
```
function validateResponse(schemas, response):
    validatedData = {}
    
    if schemas.body exists:
        data = response.body || response  // Handle both formats
        validatedData.body = validate(schemas.body, data)  // Throws on error
    
    if schemas.headers exists:
        data = response.headers
        validatedData.headers = validate(schemas.headers, data)  // Throws on error
    
    return validatedData
```

**Error Handling**:
- standard-schema throws error on validation failure
- Error propagates to Router's error handler
- No automatic logging (user handles via error handler)
- Fail fast: first validation error stops processing

**Key Characteristics**:
- Validate undefined as-is (schema must allow undefined)
- Let schema library handle error details
- No automatic logging
- Fail fast on first error

---

## Standard Schema Integration

### Validation Execution

**Function**: `validate(schema, data)`

**Logic**:
1. Call standard-schema validation API
2. Let standard-schema throw error on failure
3. Return validated data on success

**Pseudocode**:
```
function validate(schema, data):
    // standard-schema throws on validation failure
    result = standardSchema.validate(schema, data)
    return result  // Validated and typed data
```

**Error Handling**:
- standard-schema throws error with validation details
- Error includes field paths, messages, actual values (library-specific)
- Middleware does not catch or transform errors
- Router's error handler catches and formats errors

**Key Characteristics**:
- Minimal wrapper around standard-schema
- No error transformation
- No custom error construction
- Delegate everything to schema library

---

## Data Flow Diagrams

### Registration Time Flow

```
User Configuration
    │
    ├─> validation(config)
    │       │
    │       ├─> Extract req schemas
    │       ├─> Extract res schemas
    │       │
    │       └─> Return middleware function (with closured schemas)
    │
    └─> Middleware registered in Router
```

### Request Time Flow

```
Incoming Request
    │
    ├─> Middleware function executes
    │       │
    │       ├─> validateRequest(reqSchemas, reqCtx)
    │       │       ├─> Validate body (if schema exists)
    │       │       ├─> Validate headers (if schema exists)
    │       │       ├─> Validate path (if schema exists)
    │       │       └─> Validate query (if schema exists)
    │       │           └─> standard-schema.validate() [throws on error]
    │       │
    │       ├─> Execute handler(validatedReq)
    │       │
    │       └─> validateResponse(resSchemas, response)
    │               ├─> Validate body (if schema exists)
    │               └─> Validate headers (if schema exists)
    │                   └─> standard-schema.validate() [throws on error]
    │
    └─> Return validated response
```

### Error Flow

```
Validation Failure
    │
    ├─> standard-schema throws error
    │       │
    │       └─> Error propagates through middleware
    │
    └─> Router's error handler catches error
            │
            ├─> Format HTTP 422 (request validation)
            └─> Format HTTP 500 (response validation)
```

---

## Algorithm Complexity

### Time Complexity
- **Registration**: O(1) - Simple schema extraction
- **Request Validation**: O(n) where n = number of configured components (max 4: body, headers, path, query)
- **Response Validation**: O(m) where m = number of configured components (max 2: body, headers)
- **Schema Validation**: Depends on schema library implementation

### Space Complexity
- **Registration**: O(1) - Store schema references
- **Request Validation**: O(1) - Validated data structure
- **Response Validation**: O(1) - Validated data structure

---

## Edge Cases

### Empty Configuration
- **Scenario**: `validation({})` with no req or res schemas
- **Behavior**: Middleware passes through without validation
- **Rationale**: Allow flexible configuration

### Undefined Components
- **Scenario**: Request component is undefined (e.g., no body)
- **Behavior**: Pass undefined to schema validation
- **Rationale**: Schema must explicitly allow undefined if optional

### Validation Error
- **Scenario**: Schema validation fails
- **Behavior**: standard-schema throws error, propagates to Router
- **Rationale**: Fail fast, let Router handle error formatting

### Multiple Schemas
- **Scenario**: Multiple request components configured
- **Behavior**: Validate in order: body, headers, path, query
- **Rationale**: Fail fast on first error

---

## Performance Considerations

### Registration Time
- Minimal overhead: extract schemas, create closure
- No validation or parsing at registration
- Fast middleware registration

### Request Time
- Validation overhead depends on schema complexity
- Fail fast reduces unnecessary validation
- No error transformation overhead
- Direct delegation to standard-schema

---

## Design Rationale

### Trust User Configuration
- No configuration validation reduces complexity
- TypeScript provides compile-time safety
- Runtime errors caught by schema validation

### Delegate to Schema Library
- Avoid reimplementing validation logic
- Leverage schema library's type coercion
- Use schema library's error details
- Consistent behavior across libraries (Zod, Valibot, ArkType)

### Fail Fast
- Stop on first validation error
- Simpler error handling
- Better performance (no unnecessary validation)

### No Automatic Logging
- User controls logging via error handler
- Avoid opinionated logging behavior
- Flexibility for different logging strategies

### Minimal Abstraction
- Thin wrapper around standard-schema
- No unnecessary helper functions
- Direct, understandable logic
