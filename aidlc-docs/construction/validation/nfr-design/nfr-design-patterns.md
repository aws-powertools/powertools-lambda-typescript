# NFR Design Patterns - Validation Middleware

**Unit**: Event Handler Validation  
**Date**: 2025-11-07

---

## Overview

This document defines design patterns to implement non-functional requirements for the validation middleware.

---

## Performance Patterns

### Pattern 1: Factory Pattern with Closure

**Purpose**: Parse configuration once at registration, not per request

**Implementation**:
```typescript
function validation<TReq, TRes>(config: ValidationConfig<TReq, TRes>) {
  // Parse configuration once (registration time)
  const reqSchemas = config.req || {};
  const resSchemas = config.res || {};
  
  // Return middleware with closured schemas
  return async (reqCtx, handler) => {
    // Use closured schemas (request time)
    if (reqSchemas) validateRequest(reqSchemas, reqCtx);
    const response = await handler();
    if (resSchemas) validateResponse(resSchemas, response);
    return response;
  };
}
```

**Benefits**:
- Configuration parsing happens once
- No repeated overhead per request
- Clean separation of registration vs request time

**NFR Addressed**: PERF-2 (Configuration Parsing)

---

### Pattern 2: Fail-Fast Error Handling

**Purpose**: Stop validation on first error to avoid unnecessary work

**Implementation**:
```typescript
function validateRequest(schemas, reqCtx) {
  // Validate in sequence, let errors propagate
  if (schemas.body) validate(schemas.body, reqCtx.body); // Throws on error
  if (schemas.headers) validate(schemas.headers, reqCtx.headers); // Never reached if body fails
  if (schemas.path) validate(schemas.path, reqCtx.pathParameters);
  if (schemas.query) validate(schemas.query, reqCtx.queryStringParameters);
}
```

**Benefits**:
- Better performance (no unnecessary validation)
- Simpler error handling
- Clear error signal

**NFR Addressed**: PERF-3 (Fail Fast)

---

### Pattern 3: Minimal Abstraction

**Purpose**: Avoid unnecessary helper functions and layers

**Implementation**:
```typescript
// ❌ Avoid: Unnecessary abstraction
function validateComponent(schema, data, component) {
  return validateWithSchema(schema, data, component);
}

// ✅ Prefer: Direct validation
if (schemas.body) validate(schemas.body, reqCtx.body);
```

**Benefits**:
- Fewer function calls
- Easier to understand
- Less maintenance

**NFR Addressed**: MAINT-1 (Minimal Abstraction)

---

## Security Patterns

### Pattern 4: Environment-Based Error Exposure

**Purpose**: Control error detail exposure based on POWERTOOLS_DEV

**Implementation**:
```typescript
function formatValidationError(error, component) {
  const isDev = process.env.POWERTOOLS_DEV === 'true';
  
  if (isDev) {
    // Full details in development
    return {
      component,
      errors: error.issues, // Full schema library errors
      message: error.message
    };
  } else {
    // Minimal details in production
    return {
      component,
      message: 'Validation failed'
    };
  }
}
```

**Benefits**:
- Development-friendly (full details)
- Production-safe (minimal exposure)
- Simple environment check

**NFR Addressed**: SEC-1 (Error Information Exposure)

---

### Pattern 5: Error Delegation

**Purpose**: Let schema library handle error details, delegate to Router for formatting

**Implementation**:
```typescript
function validateRequest(schemas, reqCtx) {
  // Let standard-schema throw errors
  if (schemas.body) {
    const result = standardSchema.validate(schemas.body, reqCtx.body);
    // Error thrown by standard-schema, propagates to Router
  }
}

// Router's error handler formats the error
app.errorHandler(RequestValidationError, (error) => {
  return formatValidationError(error, error.component);
});
```

**Benefits**:
- Consistent error handling
- User controls error formatting
- No error transformation in middleware

**NFR Addressed**: SEC-2 (User-Controlled Error Handling), REL-1 (Error Propagation)

---

## Type Safety Patterns

### Pattern 6: Generic Type Inference

**Purpose**: Automatic type inference from validation schemas

**Implementation**:
```typescript
// Generic type parameters
function validation<TReq, TRes>(
  config: ValidationConfig<TReq, TRes>
): MiddlewareFunction<TReq, TRes> {
  // Implementation
}

// Usage - types inferred automatically
const middleware = validation({
  req: {
    body: z.object({ title: z.string() }) // TReq['body'] = { title: string }
  },
  res: {
    body: z.object({ success: z.boolean() }) // TRes['body'] = { success: boolean }
  }
});
```

**Benefits**:
- Automatic type inference
- No manual type annotations
- IDE autocomplete support

**NFR Addressed**: USE-1 (Type Inference), MAINT-3 (TypeScript Strict Mode)

---

### Pattern 7: Utility Types for Schema Extraction

**Purpose**: Extract types from Standard Schema definitions

**Implementation**:
```typescript
// Utility type to extract schema type
type InferSchema<T> = T extends StandardSchema<infer U> ? U : never;

// Usage in type definitions
type ValidatedRequest<TReq> = {
  body?: InferSchema<TReq['body']>;
  headers?: InferSchema<TReq['headers']>;
  path?: InferSchema<TReq['path']>;
  query?: InferSchema<TReq['query']>;
};
```

**Benefits**:
- Type-safe schema extraction
- Works with any Standard Schema library
- Compile-time type checking

**NFR Addressed**: USE-1 (Type Inference), MAINT-3 (TypeScript Strict Mode)

---

## Reliability Patterns

### Pattern 8: Error Propagation

**Purpose**: Let errors propagate without catching

**Implementation**:
```typescript
// ❌ Avoid: Catching and transforming errors
try {
  validate(schema, data);
} catch (error) {
  throw new CustomError(error);
}

// ✅ Prefer: Let errors propagate
validate(schema, data); // Throws, propagates to Router
```

**Benefits**:
- Simpler error handling
- Consistent error flow
- Router handles all errors

**NFR Addressed**: REL-1 (Error Propagation), REL-3 (Schema Library Errors)

---

### Pattern 9: Graceful Degradation

**Purpose**: Handle missing configuration gracefully

**Implementation**:
```typescript
function validation(config) {
  const reqSchemas = config.req || {};
  const resSchemas = config.res || {};
  
  return async (reqCtx, handler) => {
    // Only validate if schemas exist
    if (Object.keys(reqSchemas).length > 0) {
      validateRequest(reqSchemas, reqCtx);
    }
    
    const response = await handler();
    
    if (Object.keys(resSchemas).length > 0) {
      validateResponse(resSchemas, response);
    }
    
    return response;
  };
}
```

**Benefits**:
- Flexible configuration
- No forced validation
- Handles empty config

**NFR Addressed**: REL-2 (Graceful Degradation)

---

## Scalability Patterns

### Pattern 10: Stateless Design

**Purpose**: No shared state between requests

**Implementation**:
```typescript
function validation(config) {
  // Immutable closure - no mutable state
  const reqSchemas = config.req || {};
  const resSchemas = config.res || {};
  
  return async (reqCtx, handler) => {
    // No shared state, each request independent
    const validatedReq = validateRequest(reqSchemas, reqCtx);
    const response = await handler(validatedReq);
    return validateResponse(resSchemas, response);
  };
}
```

**Benefits**:
- Horizontal scaling
- No race conditions
- Thread-safe

**NFR Addressed**: SCALE-1 (Stateless Design)

---

## Maintainability Patterns

### Pattern 11: TypeScript Strict Mode Compatibility

**Purpose**: Maximum type safety with strict mode

**Implementation**:
```typescript
// Strict null checks
function validateRequest(
  schemas: RequestValidationConfig | undefined,
  reqCtx: RequestContext
): ValidatedRequest {
  if (!schemas) return {};
  
  // Explicit undefined handling
  const body = schemas.body ? validate(schemas.body, reqCtx.body) : undefined;
  
  return { body };
}
```

**Benefits**:
- Catch errors at compile time
- Explicit null/undefined handling
- Better code quality

**NFR Addressed**: MAINT-3 (TypeScript Strict Mode)

---

## Pattern Application Summary

| Pattern | NFR Category | Priority | Complexity |
|---------|-------------|----------|------------|
| Factory with Closure | Performance | High | Low |
| Fail-Fast | Performance | High | Low |
| Minimal Abstraction | Maintainability | High | Low |
| Environment-Based Error Exposure | Security | High | Low |
| Error Delegation | Security, Reliability | High | Low |
| Generic Type Inference | Type Safety | High | Medium |
| Utility Types | Type Safety | High | Medium |
| Error Propagation | Reliability | High | Low |
| Graceful Degradation | Reliability | Medium | Low |
| Stateless Design | Scalability | High | Low |
| Strict Mode Compatibility | Maintainability | High | Medium |

---

## Pattern Integration

### Combined Pattern Example

```typescript
// Factory Pattern + Closure
function validation<TReq, TRes>(config: ValidationConfig<TReq, TRes>) {
  // Parse once (registration time)
  const reqSchemas = config.req || {};
  const resSchemas = config.res || {};
  
  // Return middleware (stateless)
  return async (reqCtx, handler) => {
    // Graceful degradation
    if (Object.keys(reqSchemas).length > 0) {
      // Fail-fast + Error propagation
      validateRequest(reqSchemas, reqCtx); // Throws on error
    }
    
    const response = await handler();
    
    // Graceful degradation
    if (Object.keys(resSchemas).length > 0) {
      // Fail-fast + Error propagation
      validateResponse(resSchemas, response); // Throws on error
    }
    
    return response;
  };
}

// Error handling with environment-based exposure
app.errorHandler(RequestValidationError, (error) => {
  const isDev = process.env.POWERTOOLS_DEV === 'true';
  
  return {
    statusCode: 422,
    body: JSON.stringify({
      message: isDev ? error.message : 'Validation failed',
      errors: isDev ? error.details : undefined
    })
  };
});
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Configuration Parsing Per Request
```typescript
// ❌ Avoid
return async (reqCtx, handler) => {
  const schemas = parseConfig(config); // Repeated parsing
};
```

### Anti-Pattern 2: Collecting All Errors
```typescript
// ❌ Avoid
const errors = [];
try { validate(body); } catch (e) { errors.push(e); }
try { validate(headers); } catch (e) { errors.push(e); }
return errors; // Unnecessary work
```

### Anti-Pattern 3: Custom Error Transformation
```typescript
// ❌ Avoid
catch (error) {
  return new CustomError(transformError(error)); // Unnecessary transformation
}
```

### Anti-Pattern 4: Shared Mutable State
```typescript
// ❌ Avoid
let validationCount = 0; // Shared state
return async () => {
  validationCount++; // Not thread-safe
};
```

---

## Pattern Selection Guide

**For Performance**: Use Factory + Closure, Fail-Fast, Minimal Abstraction

**For Security**: Use Environment-Based Error Exposure, Error Delegation

**For Type Safety**: Use Generic Type Inference, Utility Types, Strict Mode

**For Reliability**: Use Error Propagation, Graceful Degradation

**For Scalability**: Use Stateless Design

**For Maintainability**: Use Minimal Abstraction, Strict Mode Compatibility
