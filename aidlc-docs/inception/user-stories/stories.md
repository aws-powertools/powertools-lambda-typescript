# User Stories

**Feature**: GitHub Issue #4516 - Data Validation in Event Handler  
**Date**: 2025-11-07  
**Format**: Job Stories (When/I want/so I can)  
**Organization**: Feature-Based

---

## Story Organization

Stories are organized by feature area:
1. **Schema Configuration** - Setting up validation schemas
2. **Request Validation** - Validating incoming requests
3. **Response Validation** - Validating outgoing responses
4. **Error Handling** - Managing validation failures
5. **Type Safety** - TypeScript type inference
6. **OpenAPI Integration** - Schema-based documentation

---

## 1. Schema Configuration Stories

### Story 1.1: Configure Input Schema for Route
**When** configuring a route that accepts request data, **I want to** specify an input validation schema, **so I can** ensure incoming data meets expected structure and types.

**Acceptance Criteria**:
- Can provide Standard Schema-compatible schema (Zod, Valibot, ArkType) in route configuration
- Schema is specified via `validation: { input: schema }` option
- Route accepts schema without requiring additional setup
- Schema configuration is type-safe at compile time
- Can configure input schema without output schema

**Technical Notes**:
- Integrates with route registration API
- Supports all Standard Schema-compatible libraries
- Schema stored in route metadata for middleware access

**Requirements**: FR-1, FR-4  
**Dependencies**: None

---

### Story 1.2: Configure Output Schema for Route
**When** implementing a route that returns data, **I want to** specify an output validation schema, **so I can** ensure responses match expected structure before sending to clients.

**Acceptance Criteria**:
- Can provide Standard Schema-compatible schema in route configuration
- Schema is specified via `validation: { output: schema }` option
- Route accepts schema without requiring additional setup
- Schema configuration is type-safe at compile time
- Can configure output schema without input schema

**Technical Notes**:
- Response validation occurs after handler execution
- Schema applied to handler return value
- Supports async schema validation if needed

**Requirements**: FR-1, FR-4  
**Dependencies**: None

---

### Story 1.3: Configure Both Input and Output Schemas
**When** building a route with full validation, **I want to** specify both input and output schemas together, **so I can** validate the complete request/response cycle.

**Acceptance Criteria**:
- Can provide both input and output schemas in single configuration
- Configuration uses `validation: { input: inputSchema, output: outputSchema }`
- Both schemas validated independently
- Input validation occurs before handler, output after handler
- Type inference works for both input and output

**Technical Notes**:
- Middleware handles both validations in correct order
- Independent schema validation (input failure doesn't prevent output schema loading)
- Both schemas accessible for OpenAPI generation

**Requirements**: FR-1, FR-4  
**Dependencies**: Story 1.1, Story 1.2

---

### Story 1.4: Use Zod Schemas for Validation
**When** using Zod as the validation library, **I want to** provide Zod schemas directly in route configuration, **so I can** leverage Zod's validation capabilities and type inference.

**Acceptance Criteria**:
- Can use `z.object()`, `z.string()`, and other Zod schema types
- Zod schema validation errors are properly caught and handled
- TypeScript types are inferred from Zod schemas using `z.infer`
- Zod-specific features (transforms, refinements) work correctly
- No additional Zod configuration required beyond schema definition

**Technical Notes**:
- Standard Schema abstraction handles Zod integration
- Zod peer dependency (user installs)
- Support Zod v4.x

**Requirements**: FR-1  
**Dependencies**: Story 1.1 or Story 1.2

---

### Story 1.5: Use Valibot Schemas for Validation
**When** using Valibot as the validation library, **I want to** provide Valibot schemas directly in route configuration, **so I can** leverage Valibot's lightweight validation.

**Acceptance Criteria**:
- Can use Valibot schema types (object, string, etc.)
- Valibot schema validation errors are properly caught and handled
- TypeScript types are inferred from Valibot schemas
- Valibot-specific features work correctly
- No additional Valibot configuration required

**Technical Notes**:
- Standard Schema abstraction handles Valibot integration
- Valibot peer dependency (user installs)
- Support Valibot v1.x

**Requirements**: FR-1  
**Dependencies**: Story 1.1 or Story 1.2

---

### Story 1.6: Use ArkType Schemas for Validation
**When** using ArkType as the validation library, **I want to** provide ArkType schemas directly in route configuration, **so I can** leverage ArkType's type-first validation.

**Acceptance Criteria**:
- Can use ArkType schema types
- ArkType schema validation errors are properly caught and handled
- TypeScript types are inferred from ArkType schemas
- ArkType-specific features work correctly
- No additional ArkType configuration required

**Technical Notes**:
- Standard Schema abstraction handles ArkType integration
- ArkType peer dependency (user installs)
- Support ArkType v2.x

**Requirements**: FR-1  
**Dependencies**: Story 1.1 or Story 1.2

---

## 2. Request Validation Stories

### Story 2.1: Validate Request Body Against Schema
**When** receiving a request with a body, **I want to** automatically validate the body against the configured input schema, **so I can** reject invalid requests before handler execution.

**Acceptance Criteria**:
- Parsed body is validated against input schema before handler runs
- Valid data is passed to handler with correct TypeScript types
- Invalid data triggers validation error (HTTP 422)
- Validation occurs for both JSON and form-encoded content types

**Technical Notes**:
- Middleware intercepts request before handler
- Assume that the body is already parsed as per the content type
- Validation errors include schema violation details

**Requirements**: FR-2, NFR-5  
**Dependencies**: Story 1.1

---

### Story 2.2: Access Validated Request Data in Handler
**When** implementing a route handler with input validation, **I want to** access validated request data with correct TypeScript types, **so I can** use the data safely without additional type checks.

**Acceptance Criteria**:
- Handler receives validated data as typed parameter
- TypeScript infers types from input schema automatically
- IDE provides autocomplete for validated data properties
- No manual type casting required
- Validated data structure matches schema definition exactly

**Technical Notes**:
- Type inference via TypeScript generics
- Handler signature: `async (data) => { ... }` where data is inferred type
- Validation middleware populates typed data before handler call

**Requirements**: FR-2, FR-6  
**Dependencies**: Story 2.1

---

## 3. Response Validation Stories

### Story 3.1: Validate Response Body Against Schema
**When** returning data from a route handler, **I want to** automatically validate the response against the configured output schema, **so I can** ensure consistent response structure.

**Acceptance Criteria**:
- Handler return value is validated against output schema
- Valid responses continue to be serialized and sent to client
- Invalid responses trigger validation error (HTTP 500)
- Validation occurs after handler execution completes
- Validation errors are logged for debugging

**Technical Notes**:
- Middleware intercepts handler return value
- Validation before response serialization
- Response validation failures indicate handler bugs
- Detailed error logging for troubleshooting

**Requirements**: FR-3  
**Dependencies**: Story 1.2

---

### Story 3.2: Infer Response Types from Schema
**When** implementing a route handler with output validation, **I want to** have TypeScript enforce the return type matches the output schema, **so I can** catch type mismatches at compile time.

**Acceptance Criteria**:
- Handler return type is inferred from output schema
- TypeScript compiler errors if handler returns wrong type
- IDE provides autocomplete for response structure
- Type checking works with async handlers
- Complex nested types are inferred correctly

**Technical Notes**:
- Type inference via TypeScript generics
- Handler signature enforces return type
- Compile-time and runtime validation alignment

**Requirements**: FR-3, FR-6  
**Dependencies**: Story 3.1

---

### Story 3.3: Validate Async Handler Responses
**When** implementing an async route handler with output validation, **I want to** validate the resolved promise value, **so I can** ensure async operations return valid data.

**Acceptance Criteria**:
- Awaits handler promise before validation
- Validates resolved value against output schema
- Handles promise rejections appropriately
- Type inference works with Promise return types
- Validation errors include async context

**Technical Notes**:
- Middleware awaits handler completion
- Promise rejection handled separately from validation
- Validation occurs on resolved value only

**Requirements**: FR-3, FR-6  
**Dependencies**: Story 3.1

---

## 4. Error Handling Stories

### Story 4.1: Return HTTP 422 for Request Validation Failures
**When** request validation fails, **I want to** receive an HTTP 422 Unprocessable Entity response, **so I can** distinguish validation errors from other client errors.

**Acceptance Criteria**:
- Request body validation failures return HTTP 422 status code
- Response includes validation error details in body
- Error response format is consistent and parseable
- Multiple validation errors are included in single response
- Error details include field names and violation descriptions

**Technical Notes**:
- RequestValidationError exception thrown by middleware
- Default error handler formats 422 response
- Error body structure: `{ statusCode: 422, errors: [...] }`
- Compatible with existing error handler registry

**Requirements**: FR-5  
**Dependencies**: Story 2.1

---

### Story 4.2: Return HTTP 500 for Response Validation Failures
**When** response validation fails, **I want to** receive an HTTP 500 Internal Server Error response, **so I can** identify handler implementation issues.

**Acceptance Criteria**:
- Response body validation failures return HTTP 500 status code
- Response indicates server error (not client error)
- Error is logged with full validation details
- Client receives generic error message (security)
- Detailed error available in logs for debugging

**Technical Notes**:
- ResponseValidationError exception thrown by middleware
- Default error handler formats 500 response
- Detailed errors logged but not exposed to client
- Indicates handler bug (returning wrong structure)

**Requirements**: FR-5  
**Dependencies**: Story 3.1

---

### Story 4.3: Customize Validation Error Responses
**When** handling validation errors, **I want to** customize the error response format and content, **so I can** meet specific API requirements or security policies.

**Acceptance Criteria**:
- Can register custom error handler for RequestValidationError
- Can register custom error handler for ResponseValidationError
- Custom handlers receive full error details
- Custom handlers can return custom response structure
- Custom handlers can implement opaque error messages

**Technical Notes**:
- Uses existing error handler registry
- Error handler registration: `app.errorHandler(RequestValidationError, handler)`
- Handler receives error object with validation details
- Handler returns custom response object

**Requirements**: FR-5  
**Dependencies**: Story 4.1, Story 4.2

---

### Story 4.4: Access Validation Error Details
**When** handling validation errors, **I want to** access detailed error information, **so I can** log, monitor, or customize error responses.

**Acceptance Criteria**:
- RequestValidationError includes field-level error details
- ResponseValidationError includes field-level error details
- Error objects include schema path to failed field
- Error objects include validation rule that failed
- Error objects include actual value that failed validation

**Technical Notes**:
- Error structure from Standard Schema validation
- Errors array with: path, message, value
- Compatible with different schema libraries
- Structured for logging and monitoring

**Requirements**: FR-5  
**Dependencies**: Story 4.1, Story 4.2

---

### Story 4.5: Implement Opaque Error Responses for Security
**When** implementing security-sensitive APIs, **I want to** return opaque validation error messages, **so I can** avoid exposing internal schema details to clients.

**Acceptance Criteria**:
- Can configure custom error handler to return generic messages
- Detailed errors still logged for debugging
- Client receives minimal error information
- Security policy compliance maintained
- Opaque errors still return correct HTTP status codes

**Technical Notes**:
- Custom error handler returns generic message
- Example: "Invalid request data" instead of field details
- Detailed errors logged via Logger integration
- Configurable per route or globally

**Requirements**: FR-5  
**Dependencies**: Story 4.3

---

## 5. Type Safety Stories

### Story 5.1: Infer Request Body Types from Input Schema
**When** configuring input validation, **I want to** automatically infer TypeScript types for request data, **so I can** access validated data with full type safety.

**Acceptance Criteria**:
- Handler parameter types inferred from input schema
- IDE autocomplete works for request data properties
- TypeScript compiler catches type errors
- Works with complex nested schemas
- Type inference works with all supported schema libraries

**Technical Notes**:
- Generic type parameter on route registration
- Type extraction from Standard Schema
- Handler signature: `(data: InferredType) => ...`

**Requirements**: FR-6  
**Dependencies**: Story 1.1, Story 2.2

---

### Story 5.2: Infer Response Types from Output Schema
**When** configuring output validation, **I want to** automatically infer TypeScript return types for handlers, **so I can** ensure handlers return correct data structure.

**Acceptance Criteria**:
- Handler return type inferred from output schema
- TypeScript compiler errors if return type mismatches
- IDE autocomplete works for response structure
- Works with async handlers (Promise types)
- Type inference works with all supported schema libraries

**Technical Notes**:
- Generic type parameter on route registration
- Type extraction from Standard Schema
- Handler signature: `() => Promise<InferredType>`

**Requirements**: FR-6  
**Dependencies**: Story 1.2, Story 3.2

---

### Story 5.3: Maintain Type Safety Across Request Lifecycle
**When** implementing validated routes, **I want to** maintain type safety from request to response, **so I can** catch type errors at compile time throughout the handler.

**Acceptance Criteria**:
- Input types flow into handler parameters
- Output types constrain handler return values
- Intermediate variables maintain correct types
- Type errors caught before runtime
- No type casting required in handler implementation

**Technical Notes**:
- End-to-end type inference
- TypeScript strict mode compatible
- Generic constraints ensure type consistency

**Requirements**: FR-6  
**Dependencies**: Story 5.1, Story 5.2

---

## 6. OpenAPI Integration Stories

### Story 6.1: Configure Request Schema with Multiple Components
**When** configuring validation for a route, **I want to** specify schemas for request body, headers, path parameters, and query strings together, **so I can** validate all aspects of the incoming request.

**Acceptance Criteria**:
- Can provide request schema structure with multiple components: `req: { body, headers, path, query }`
- Each component accepts Standard Schema-compatible schemas
- All components are optional (can specify only needed parts)
- Configuration is type-safe at compile time
- Schemas are validated independently for each component

**Technical Notes**:
- Request structure: `validation: { req: { body: schema, headers: schema, path: schema, query: schema } }`
- All schemas use Standard Schema specification
- Backward compatible with simple `input` configuration
- Each component validated at appropriate point in request lifecycle

**Requirements**: FR-1, FR-4, FR-8  
**Dependencies**: Story 1.1

---

### Story 6.2: Configure Response Schema with Multiple Components
**When** configuring validation for a route response, **I want to** specify schemas for response body and headers together, **so I can** validate complete response structure.

**Acceptance Criteria**:
- Can provide response schema structure with multiple components: `res: { body, headers }`
- Each component accepts Standard Schema-compatible schemas
- All components are optional (can specify only needed parts)
- Configuration is type-safe at compile time
- Schemas are validated independently for each component

**Technical Notes**:
- Response structure: `validation: { res: { body: schema, headers: schema } }`
- All schemas use Standard Schema specification
- Backward compatible with simple `output` configuration
- Response headers validated before sending to client

**Requirements**: FR-1, FR-4, FR-8  
**Dependencies**: Story 1.2

---

### Story 6.3: Validate Request Headers Against Schema
**When** receiving a request with specific header requirements, **I want to** validate headers against a schema, **so I can** ensure required headers are present and correctly formatted.

**Acceptance Criteria**:
- Request headers validated against configured schema
- Validation occurs before route handler execution
- Invalid headers trigger validation error (HTTP 422)
- Header names are case-insensitive during validation
- Validated headers accessible in handler with correct types

**Technical Notes**:
- Headers schema in `req.headers`
- Case-insensitive header matching
- Type inference for header values
- Common headers: Authorization, Content-Type, X-Api-Key, etc.

**Requirements**: FR-2, FR-6, FR-8  
**Dependencies**: Story 6.1

---

### Story 6.4: Validate Path Parameters Against Schema
**When** defining a route with path parameters, **I want to** validate path parameters against a schema, **so I can** ensure parameters meet expected format and constraints.

**Acceptance Criteria**:
- Path parameters validated against configured schema
- Validation occurs before route handler execution
- Invalid path parameters trigger validation error (HTTP 422)
- Schema defines parameter types and constraints
- Validated parameters accessible in handler with correct types

**Technical Notes**:
- Path schema in `req.path`
- Schema keys match path parameter names (e.g., `:todoId`)
- Type coercion based on schema (string to number, etc.)
- Validation includes format, range, pattern constraints

**Requirements**: FR-2, FR-6, FR-8  
**Dependencies**: Story 6.1

---

### Story 6.5: Validate Query Strings Against Schema
**When** handling requests with query parameters, **I want to** validate query strings against a schema, **so I can** ensure query parameters are valid and properly typed.

**Acceptance Criteria**:
- Query parameters validated against configured schema
- Validation occurs before route handler execution
- Invalid query parameters trigger validation error (HTTP 422)
- Schema defines parameter types, defaults, and constraints
- Validated query parameters accessible in handler with correct types

**Technical Notes**:
- Query schema in `req.query`
- Type coercion based on schema
- Support for optional parameters with defaults
- Array query parameters supported (e.g., `?tags=a&tags=b`)

**Requirements**: FR-2, FR-6, FR-8  
**Dependencies**: Story 6.1

---

### Story 6.6: Validate Response Headers Against Schema
**When** returning a response with specific headers, **I want to** validate response headers against a schema, **so I can** ensure consistent header structure.

**Acceptance Criteria**:
- Response headers validated against configured schema
- Validation occurs after route handler execution
- Invalid headers trigger validation error (HTTP 500)
- Schema defines required and optional headers
- Type-safe header configuration in handler

**Technical Notes**:
- Headers schema in `res.headers`
- Validation before response sent to client
- Common response headers: Content-Type, Cache-Control, etc.
- Handler can set headers with type safety

**Requirements**: FR-3, FR-6, FR-8  
**Dependencies**: Story 6.2

---

### Story 6.7: Generate OpenAPI Schema from All Request Components
**When** using comprehensive request validation schemas, **I want to** automatically generate complete OpenAPI specification, **so I can** document all request aspects without duplication.

**Acceptance Criteria**:
- Request body schemas converted to OpenAPI request body schemas
- Request headers schemas converted to OpenAPI parameter definitions (in: header)
- Path parameter schemas converted to OpenAPI parameter definitions (in: path)
- Query parameter schemas converted to OpenAPI parameter definitions (in: query)
- Schema conversion preserves validation rules and constraints
- Generated OpenAPI spec is valid and complete

**Technical Notes**:
- Standard Schema to OpenAPI conversion for all components
- OpenAPI parameter objects with correct `in` field
- Required/optional parameters properly marked
- Type and format constraints preserved
- Integration with issue #4515 (OpenAPI support)

**Requirements**: FR-8  
**Dependencies**: Story 6.1, Story 6.3, Story 6.4, Story 6.5

---

### Story 6.8: Generate OpenAPI Schema from All Response Components
**When** using comprehensive response validation schemas, **I want to** automatically generate complete OpenAPI response specification, **so I can** document all response aspects.

**Acceptance Criteria**:
- Response body schemas converted to OpenAPI response content schemas
- Response headers schemas converted to OpenAPI response header definitions
- Schema conversion preserves validation rules
- Multiple response status codes supported
- Generated OpenAPI spec is valid and complete

**Technical Notes**:
- Standard Schema to OpenAPI conversion for response components
- OpenAPI response headers object
- Content-Type specific response schemas
- Status code specific responses

**Requirements**: FR-8  
**Dependencies**: Story 6.2, Story 6.6

---

### Story 6.9: Enable SwaggerUI with Comprehensive Validated Routes
**When** building APIs with comprehensive validation, **I want to** enable SwaggerUI to visualize and test all request/response components, **so I can** provide complete interactive API documentation.

**Acceptance Criteria**:
- SwaggerUI displays all validated route components
- Request body, headers, path, and query parameters shown in UI
- Response body and headers shown in UI
- Validation rules visible in documentation
- Can test routes with all components directly from SwaggerUI
- Schema examples generated for all components

**Technical Notes**:
- SwaggerUI integration via comprehensive OpenAPI spec
- Interactive testing includes validation for all components
- Parameter forms generated for headers, path, query
- Request/response examples include all components

**Requirements**: FR-8  
**Dependencies**: Story 6.7, Story 6.8

---

### Story 6.10: Maintain Backward Compatibility with Simple Configuration
**When** using existing simple validation configuration, **I want to** continue using `input` and `output` schemas, **so I can** avoid breaking changes while new configuration is available.

**Acceptance Criteria**:
- Existing `validation: { input, output }` configuration still works
- `input` schema maps to `req.body` internally
- `output` schema maps to `res.body` internally
- Can mix simple and comprehensive configuration
- Type inference works for both configuration styles

**Technical Notes**:
- Backward compatibility layer
- `input` → `req: { body: input }`
- `output` → `res: { body: output }`
- Gradual migration path for users
- No breaking changes to existing code

**Requirements**: NFR-2  
**Dependencies**: Story 6.1, Story 6.2

---

### Story 6.11: Customize OpenAPI Metadata for Validated Routes
**When** generating OpenAPI specs, **I want to** add custom metadata to validated routes, **so I can** provide comprehensive API documentation.

**Acceptance Criteria**:
- Can add descriptions to validated routes
- Can add examples to all schema components
- Can add tags and operation IDs
- Can mark routes as deprecated
- Metadata appears in generated OpenAPI spec

**Technical Notes**:
- OpenAPI metadata in route configuration
- Extends validation configuration
- Compatible with RFC #3500 OpenAPI customization
- Metadata: summary, description, tags, examples

**Requirements**: FR-8  
**Dependencies**: Story 6.7, Story 6.8

---

## Story Summary

**Total Stories**: 30

**By Feature Area**:
- Schema Configuration: 6 stories
- Request Validation: 4 stories
- Response Validation: 3 stories
- Error Handling: 5 stories
- Type Safety: 3 stories
- OpenAPI Integration: 11 stories (expanded to include headers, path, query validation)

**Story Dependencies**:
- 6 stories have no dependencies (foundational)
- 24 stories depend on other stories
- Maximum dependency depth: 3 levels

**Requirements Coverage**:
- FR-1 (Standard Schema): Stories 1.1-1.6, 6.1-6.2
- FR-2 (Request Validation): Stories 2.1-2.4, 6.3-6.5
- FR-3 (Response Validation): Stories 3.1-3.3, 6.6
- FR-4 (Configuration): Stories 1.1-1.3, 6.1-6.2
- FR-5 (Error Handling): Stories 4.1-4.5
- FR-6 (Type Safety): Stories 5.1-5.3, 6.3-6.6
- FR-8 (OpenAPI): Stories 6.1-6.11
- NFR-2 (Backward Compatibility): Story 6.10

All functional requirements are covered by user stories.
