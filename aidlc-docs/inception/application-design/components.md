# Application Components

**Feature**: GitHub Issue #4516 - Data Validation in Event Handler  
**Date**: 2025-11-07

---

## Component Overview

The validation system consists of a single primary component (ValidationMiddleware) that integrates with existing Event Handler infrastructure. The design follows the existing Event Handler pattern with middleware, errors, and types organized in their respective locations.

---

## Component Catalog

### 1. ValidationMiddleware

**Location**: `packages/event-handler/src/rest/middleware/validation.ts`

**Purpose**: Middleware factory that validates configuration once at registration and returns a middleware function for request/response validation.

**Responsibilities**:
- Validate and parse validation configuration at registration time (once)
- Return middleware function that validates at request time
- Execute request component validation (body, headers, path, query) before handler
- Execute response component validation (body, headers) after handler
- Construct and throw validation errors on failure
- Integrate with existing middleware chain
- Support type inference from schemas

**Key Characteristics**:
- Factory pattern: `validation(config)` returns middleware function
- Configuration parsing happens once at registration, not per request
- Single middleware handling both request and response validation
- Consolidated validation logic without unnecessary abstractions
- Uses standard-schema package directly for validation
- Leverages TypeScript built-in type inference

**Integration Points**:
- Existing middleware system (pre/post handler execution)
- Error handler registry (RequestValidationError, ResponseValidationError)
- Route configuration (validation option)
- Standard Schema package

---

### 2. Validation Error Types

**Location**: `packages/event-handler/src/rest/errors.ts` (extends existing file)

**Purpose**: Error classes for validation failures.

**Responsibilities**:
- Represent request validation failures (HTTP 422)
- Represent response validation failures (HTTP 500)
- Include validation error details (component, field, violation)
- Integrate with existing error handler registry

**Key Characteristics**:
- Extends existing Event Handler error classes
- Contains structured validation error information
- Supports custom error handling via error registry

---

### 3. Validation Types

**Location**: `packages/event-handler/src/rest/types.ts` (extends existing file)

**Purpose**: TypeScript type definitions for validation configuration and related structures.

**Responsibilities**:
- Define validation configuration structure (`req`, `res`)
- Define request component types (body, headers, path, query)
- Define response component types (body, headers)
- Support type inference from schemas
- Define validation error detail structures

**Key Characteristics**:
- Leverages TypeScript generics for type inference
- Compatible with Standard Schema types
- Extends existing Event Handler types

---

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    Route Registration                        │
│              (with validation configuration)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            validation(config) [Factory]                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Registration Time (once):                            │  │
│  │  - Validate config structure                          │  │
│  │  - Parse req/res schemas                             │  │
│  │  - Return middleware function                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Returned Middleware Function                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Request Validation (per request, before handler)     │  │
│  │  - Validate body, headers, path, query               │  │
│  │  - Throw RequestValidationError on failure           │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│                  Route Handler                               │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Response Validation (per request, after handler)     │  │
│  │  - Validate body, headers                            │  │
│  │  - Throw ResponseValidationError on failure          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Error Handler Registry                          │
│  (catches RequestValidationError, ResponseValidationError)   │
└─────────────────────────────────────────────────────────────┘
```

---

## External Dependencies

### Standard Schema Package
- **Purpose**: Validation abstraction layer
- **Usage**: Direct validation of schemas (Zod, Valibot, ArkType)
- **Integration**: ValidationMiddleware uses standard-schema API

### Existing Event Handler Components
- **Router**: Route registration with validation configuration
- **Middleware System**: Pre/post handler execution
- **Error Handler Registry**: Validation error handling
- **Types**: Extended with validation types

---

## Design Principles

1. **Simplicity**: Middleware factory pattern, minimal abstraction, consolidated logic
2. **Performance**: Configuration parsing once at registration, not per request
3. **Integration**: Follows existing Event Handler patterns
4. **Type Safety**: Leverages TypeScript built-in inference
5. **Extensibility**: Standard Schema supports multiple libraries
6. **Separation**: Validation logic separate from routing logic
7. **Consistency**: Matches existing middleware structure (cors, compress)
8. **No Tiny Abstractions**: Consolidated validation logic without unnecessary helper methods

---

## Component Boundaries

**ValidationMiddleware**:
- IN SCOPE: Validation execution, configuration parsing, error construction
- OUT OF SCOPE: Route registration, error handling (uses registry), schema definition

**Validation Errors**:
- IN SCOPE: Error representation, error details structure
- OUT OF SCOPE: Error handling logic (handled by error registry)

**Validation Types**:
- IN SCOPE: Type definitions, type inference support
- OUT OF SCOPE: Runtime validation logic

---

## No Service Layer

**Rationale**: No service layer needed for this feature.
- Validation is a middleware concern, not a service orchestration concern
- Single middleware component handles all validation logic
- No complex orchestration or multi-component coordination required
- Follows existing Event Handler pattern (no service layer for middleware)
