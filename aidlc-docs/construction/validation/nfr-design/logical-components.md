# Logical Components - Validation Middleware

**Unit**: Event Handler Validation  
**Date**: 2025-11-07

---

## Component Structure

### ValidationMiddleware Factory
**File**: `packages/event-handler/src/rest/middleware/validation.ts`
**Pattern**: Factory with Closure
**Exports**: `validation()` function

### Error Classes
**File**: `packages/event-handler/src/rest/errors.ts`
**Pattern**: Error Hierarchy (extends existing Event Handler error base)
**Classes**: `RequestValidationError`, `ResponseValidationError`

### Type Definitions
**File**: `packages/event-handler/src/rest/types.ts`
**Pattern**: Generic Types + Utility Types
**Types**: `ValidationConfig`, `RequestValidationConfig`, `ResponseValidationConfig`, `ValidatedRequest`, `ValidatedResponse`

---

## Error Class Hierarchy

```
Error (JavaScript built-in)
  └─> EventHandlerError (existing Event Handler base)
        ├─> RequestValidationError (new)
        │     - statusCode: 422
        │     - component: ValidationComponent
        │     - originalError: ValidationError
        │
        └─> ResponseValidationError (new)
              - statusCode: 500
              - component: ValidationComponent
              - originalError: ValidationError
```

**Design Decision**: Extend existing Event Handler error base class for consistency

---

## Type System Structure

### Core Types
```typescript
ValidationConfig<TReq, TRes>
  ├─> req?: RequestValidationConfig<TReq>
  └─> res?: ResponseValidationConfig<TRes>

RequestValidationConfig<T>
  ├─> body?: StandardSchema<T['body']>
  ├─> headers?: StandardSchema<T['headers']>
  ├─> path?: StandardSchema<T['path']>
  └─> query?: StandardSchema<T['query']>

ResponseValidationConfig<T>
  ├─> body?: StandardSchema<T['body']>
  └─> headers?: StandardSchema<T['headers']>
```

### Utility Types
```typescript
InferSchema<T> - Extract type from Standard Schema
ValidatedRequest<T> - Validated request data structure
ValidatedResponse<T> - Validated response data structure
```

**Design Decision**: Use both generics and utility types for comprehensive type inference

---

## Environment Configuration

### POWERTOOLS_DEV Access
**Pattern**: Direct `process.env` access
**Location**: Error formatting logic
**Usage**: `process.env.POWERTOOLS_DEV === 'true'`

**Design Decision**: Direct access (simple, no overhead)

---

## Performance Measurement

### Benchmarking Approach
**Pattern**: Production measurement (no formal benchmark suite)
**Rationale**: Pragmatic approach, measure real-world performance

**Design Decision**: No formal benchmarking infrastructure

---

## Component Integration

```
Route Registration
  └─> validation(config) [Factory]
        └─> Returns Middleware Function
              ├─> validateRequest() [uses closured schemas]
              ├─> handler()
              └─> validateResponse() [uses closured schemas]
                    └─> Errors propagate to Router
                          └─> Error Handler formats response
                                └─> Checks POWERTOOLS_DEV for detail level
```

---

## File Organization

```
packages/event-handler/src/rest/
├── middleware/
│   └── validation.ts          # Factory function, validation logic
├── errors.ts                   # Error classes (extend existing)
└── types.ts                    # Type definitions (extend existing)
```

**Design Decision**: Follow existing Event Handler structure
