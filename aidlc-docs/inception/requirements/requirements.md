# Requirements Document

**Project**: Powertools for AWS Lambda (TypeScript)  
**Feature**: GitHub Issue #4516 - First-class data validation support in Event Handler  
**Date**: 2025-11-07  
**Status**: Approved Pending

---

## Intent Analysis

### User Request
Implement GitHub Issue #4516: Add first-class support for data validation in Event Handler using Standard Schema-compatible libraries.

### Request Type
**Enhancement** - Adding new validation capabilities to existing Event Handler package

### Scope Estimate
**Single Component** - Changes focused on Event Handler package (`@aws-lambda-powertools/event-handler`)

### Complexity Estimate
**Moderate to Complex**
- Integration with Standard Schema specification
- Middleware system implementation
- Type inference and TypeScript integration
- Error handling customization
- Backward compatibility considerations

---

## Functional Requirements

### FR-1: Standard Schema Integration
**Priority**: High  
**Description**: Support Standard Schema-compatible validation libraries (Zod, Valibot, ArkType) through the standard-schema abstraction layer.

**Acceptance Criteria**:
- Support Standard Schema
- Use standard-schema package for library abstraction
- Maintain type inference from schemas (e.g., `z.infer<typeof schema>`)

**Related RFC Section**: Data validation, Standard Schema compatibility

---

### FR-2: Request Validation
**Priority**: High  
**Description**: Validate incoming request components (body, headers, path parameters, query strings) against provided schemas before route handler execution.

**Acceptance Criteria**:
- Accept request schema structure with multiple components: `req: { body, headers, path, query }`
- Parse and validate request body against body schema
- Validate request headers against headers schema (case-insensitive)
- Validate path parameters against path schema with type coercion
- Validate query strings against query schema with type coercion
- All components are optional (validate only configured parts)
- Provide validated data to route handler with correct TypeScript types
- Throw validation error on failure (HTTP 422)
- Backward compatible with simple `input` schema (maps to body)

**Related RFC Section**: Validating payloads, Headers, Query Strings, Dynamic routes

---

### FR-3: Response Validation
**Priority**: High  
**Description**: Validate outgoing response components (body, headers) against provided schemas after route handler execution.

**Acceptance Criteria**:
- Accept response schema structure with multiple components: `res: { body, headers }`
- Validate handler return value body against body schema
- Validate response headers against headers schema
- Both components are optional (validate only configured parts)
- Throw validation error on failure (HTTP 500)
- Ensure response matches expected shape before sending to client
- Backward compatible with simple `output` schema (maps to body)

**Related RFC Section**: Data validation, output schema

---

### FR-4: Validation Configuration
**Priority**: High  
**Description**: Enable validation through configuration-based approach at route registration with support for comprehensive request/response component schemas.

**Acceptance Criteria**:
- Per-route validation configuration via `validation: { req, res }` option
- Request configuration: `req: { body, headers, path, query }` (all optional)
- Response configuration: `res: { body, headers }` (all optional)
- Support validating any combination of components
- Support no validation (when validation object not provided)
- Backward compatible with simple `validation: { input, output }` format
- Simple format maps: `input` → `req.body`, `output` → `res.body`

**Related RFC Section**: Data validation examples

---

### FR-5: Validation Error Handling
**Priority**: High  
**Description**: Handle validation errors with appropriate HTTP status codes and allow customization.

**Acceptance Criteria**:
- Request component validation failures return HTTP 422 (Unprocessable Entity)
  - Applies to: body, headers, path parameters, query strings
- Response component validation failures return HTTP 500 (Internal Server Error)
  - Applies to: body, headers
- Throw `RequestValidationError` exception for request validation failures
- Throw `ResponseValidationError` exception for response validation failures
- Allow custom error handling via existing error handler registry
- Include validation error details in error response body (field name, component, violation)
- Support opaque error responses for security requirements

**Related RFC Section**: Handling validation errors

---

### FR-6: Type Safety and Inference
**Priority**: High  
**Description**: Provide automatic TypeScript type inference from validation schemas for all request and response components.

**Acceptance Criteria**:
- Infer request body types from body schema
- Infer request header types from headers schema
- Infer path parameter types from path schema
- Infer query string types from query schema
- Infer response body types from body schema
- Infer response header types from headers schema
- Provide type hints in IDE for all validated data
- Maintain type safety throughout request/response lifecycle
- Support generic types for schema inference

**Related RFC Section**: Dynamic routes type hints example

---

### FR-7: Validation Middleware
**Priority**: Medium  
**Description**: Implement validation as middleware that executes before and after route handlers.

**Acceptance Criteria**:
- Single middleware handles both request and response validation
- Request validation executes before route handler
- Response validation executes after route handler
- Configurable to validate request only, response only, or both
- Integrate with existing middleware system
- Maintain middleware execution order

**Related RFC Section**: Middleware engine (future), current validation approach

---

### FR-8: OpenAPI Integration
**Priority**: Medium  
**Description**: Support using validation schemas for comprehensive OpenAPI specification generation including all request and response components.

**Acceptance Criteria**:
- Request body schemas converted to OpenAPI request body schemas
- Request headers schemas converted to OpenAPI parameter definitions (in: header)
- Path parameter schemas converted to OpenAPI parameter definitions (in: path)
- Query string schemas converted to OpenAPI parameter definitions (in: query)
- Response body schemas converted to OpenAPI response content schemas
- Response headers schemas converted to OpenAPI response header definitions
- Support SwaggerUI with all validated components
- Generate OpenAPI schema from Standard Schema definitions
- Maintain compatibility with issue #4515 (OpenAPI support)
- All Standard Schema validation rules preserved in OpenAPI conversion

**Related RFC Section**: Enabling SwaggerUI, OpenAPI

---

## Non-Functional Requirements

### NFR-1: Performance
**Priority**: Medium  
**Description**: Validation should have minimal performance impact on request processing.

**Acceptance Criteria**:
- No schema compilation/caching optimization required (per user input)
- Validation executes synchronously
- No lazy validation implementation needed
- Minimal overhead for routes without validation

---

### NFR-2: Backward Compatibility
**Priority**: High  
**Description**: Feature must be backward compatible as it's experimental.

**Acceptance Criteria**:
- Existing routes without validation continue to work unchanged
- No breaking changes to existing Event Handler API
- Experimental feature can have breaking changes in future without major version bump

---

### NFR-3: Developer Experience
**Priority**: High  
**Description**: Provide intuitive API that follows Event Handler patterns.

**Acceptance Criteria**:
- Configuration-based validation (not decorators or middleware functions)
- Consistent with existing Event Handler API patterns
- Clear error messages for validation failures
- TypeScript type inference works automatically
- Minimal boilerplate code required

---

### NFR-4: Library Independence
**Priority**: High  
**Description**: Be independent from other Powertools validation packages.

**Acceptance Criteria**:
- No dependency on `@aws-lambda-powertools/validation` package
- No dependency on `@aws-lambda-powertools/parser` package
- Standalone implementation within Event Handler
- Can coexist with other validation packages

---

### NFR-5: Content Type Support
**Priority**: Medium  
**Description**: Support JSON and form-encoded content types.

**Acceptance Criteria**:
- Support `application/json` content type
- Support `application/x-www-form-urlencoded` content type
- Automatic content type detection and parsing
- No support for `multipart/form-data` in initial implementation

---

### NFR-6: Documentation
**Priority**: Medium  
**Description**: Provide documentation consistent with existing Event Handler docs.

**Acceptance Criteria**:
- Follow existing documentation structure and style
- Include basic usage examples
- Document error handling patterns
- Document type inference usage
- No migration guide needed (new feature)
- No comprehensive multi-library guide needed

---

## Technical Constraints

### TC-1: Standard Schema Specification
- Must comply with Standard Schema specification
- Support standard-schema package as abstraction layer
- Maintain compatibility with Zod, Valibot, and ArkType

### TC-2: TypeScript Version
- Support TypeScript versions compatible with Powertools (Node 20, 22)
- Leverage TypeScript type inference capabilities
- Maintain type safety throughout

### TC-3: Event Handler Architecture
- Integrate with existing middleware system
- Use existing error handler registry
- Follow existing route registration patterns
- Maintain Router architecture

### TC-4: Testing Approach
- No special testing utilities required
- Use standard testing approaches
- Follow existing Powertools testing patterns

---

## Validation Scope Summary

**In Scope**:
- Request body validation (input schema)
- Response body validation (output schema)
- Request headers validation
- Request path parameters validation
- Request query strings validation
- Response headers validation

**Configuration Structure**:
- Comprehensive: `validation: { req: { body, headers, path, query }, res: { body, headers } }`
- Backward compatible: `validation: { input, output }` (maps to body only)

**Out of Scope** (for this implementation):
- None - all request/response components can be validated

**Note**: All validation schemas use Standard Schema specification (https://standardschema.dev/)

---

## Error Handling Strategy

| Validation Type | HTTP Status Code | Exception Type | Description |
|----------------|------------------|----------------|-------------|
| Request Body | 422 Unprocessable Entity | RequestValidationError | Client sent invalid request body |
| Request Headers | 422 Unprocessable Entity | RequestValidationError | Client sent invalid headers |
| Path Parameters | 422 Unprocessable Entity | RequestValidationError | Client sent invalid path parameters |
| Query Strings | 422 Unprocessable Entity | RequestValidationError | Client sent invalid query parameters |
| Response Body | 500 Internal Server Error | ResponseValidationError | Handler returned invalid response body |
| Response Headers | 500 Internal Server Error | ResponseValidationError | Handler returned invalid response headers |

**Customization**:
- Developers can catch exceptions via error handler registry
- Custom error responses supported
- Opaque error messages supported for security
- Validation error details include component type (body, headers, path, query) and field information

---

## Dependencies

### Required Dependencies
- `standard-schema` - Standard Schema abstraction layer
- Peer dependencies: `zod`, `valibot`, `arktype` (user chooses which to install)

### Integration Points
- Event Handler middleware system
- Event Handler error handler registry
- Event Handler route registration
- OpenAPI generation (issue #4515)

---

## Success Criteria

2. Developers can specify input/output schemas per route
3. Request body validation fails with HTTP 422
4. Response body validation fails with HTTP 500
5. TypeScript types are inferred from schemas automatically
6. Works with Zod, Valibot, and ArkType schemas
7. Backward compatible with existing Event Handler usage
8. Validation errors can be customized via error handlers
9. Documentation follows existing Event Handler patterns
10. No breaking changes to existing API

---

## Related Issues and RFCs

- **Issue #4516**: Feature request for data validation (this implementation)
- **Issue #4515**: OpenAPI support (validation schemas should support OpenAPI generation)
- **RFC #3500**: Event Handler for REST APIs (defines validation approach)
- **Issue #413**: Original feature request for Event Handler

---

## Implementation Notes

### Comprehensive Configuration Pattern
```typescript
const app = new Router();

app.post('/todo/:todoId', async ({ body, headers, path, query }) => {
  // All validated data with inferred types
  const { title, userId } = body;
  const { authorization } = headers;
  const { todoId } = path;
  const { includeDetails } = query;
  
  return { success: true };
}, {
  validation: {
    req: {
      body: z.object({ title: z.string(), userId: z.number() }),
      headers: z.object({ authorization: z.string() }),
      path: z.object({ todoId: z.string() }),
      query: z.object({ includeDetails: z.boolean().optional() })
    },
    res: {
      body: z.object({ success: z.boolean() }),
      headers: z.object({ 'x-request-id': z.string() })
    }
  }
});
```

### Backward Compatible Simple Configuration
```typescript
app.post('/todo', async ({ title, userId, completed }) => {
  // Validated data with inferred types
  return true;
}, {
  validation: {
    input: todoSchema,    // Maps to req.body
    output: z.boolean()   // Maps to res.body
  }
});
```

### Error Handling Pattern
```typescript
app.errorHandler(RequestValidationError, (error) => {
  logger.error('Request validation failed', { 
    component: error.component, // 'body', 'headers', 'path', 'query'
    errors: error.details 
  });
  return {
    statusCode: 422,
    body: JSON.stringify({ message: 'Invalid request' })
  };
});
```

### Middleware Behavior
- Single middleware instance
- Configurable per route (any combination of components)
- Request validation executes before handler:
  - Headers validated first
  - Path parameters validated second
  - Query strings validated third
  - Body validated last
- Response validation executes after handler:
  - Body validated first
  - Headers validated second
- Integrates with existing middleware chain

---

## Assumptions

1. Standard Schema specification is stable and production-ready
2. Zod, Valibot, and ArkType maintain Standard Schema compatibility
3. Existing Event Handler middleware system supports pre/post handler execution
4. Error handler registry can handle validation-specific exceptions
5. OpenAPI integration (issue #4515) will consume validation schemas
6. Experimental status allows for future breaking changes without major version bump

---

## Open Questions

None - All clarifications received and documented.

---

## Approval Status

**Status**: Awaiting User Approval

**Next Steps**:
1. User reviews requirements document
2. User approves or requests changes
3. Proceed to Workflow Planning phase
