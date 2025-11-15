# Business Rules - Validation Middleware

**Unit**: Event Handler Validation  
**Date**: 2025-11-07

---

## Configuration Rules

### CR-1: Configuration Structure
**Rule**: Accept any configuration structure without validation  
**Rationale**: Trust user input, TypeScript provides compile-time safety  
**Enforcement**: No runtime validation at registration time

### CR-2: Optional Components
**Rule**: All req and res components are optional  
**Rationale**: Allow flexible validation configuration  
**Enforcement**: Check for schema existence before validation

### CR-3: Schema Format
**Rule**: Schemas must be Standard Schema-compatible  
**Rationale**: Enable support for Zod, Valibot, ArkType  
**Enforcement**: Delegated to standard-schema library at validation time

---

## Request Validation Rules

### RV-1: Body Parsing
**Rule**: Assume request body is already parsed by Event Handler  
**Rationale**: Event Handler handles Content-Type parsing  
**Enforcement**: Use reqCtx.body directly without parsing

### RV-2: Body Validation
**Rule**: If req.body schema exists, validate reqCtx.body against schema  
**Rationale**: Validate parsed body structure  
**Enforcement**: Call standard-schema.validate(schema, data)

### RV-3: Headers Validation
**Rule**: If req.headers schema exists, validate reqCtx.headers against schema  
**Rationale**: Validate header structure and values  
**Enforcement**: Call standard-schema.validate(schema, data)  
**Note**: Case sensitivity handled by schema library

### RV-4: Path Parameters Validation
**Rule**: If req.path schema exists, validate reqCtx.pathParameters against schema  
**Rationale**: Validate path parameter structure and types  
**Enforcement**: Call standard-schema.validate(schema, data)  
**Note**: Type coercion handled by schema library

### RV-5: Query Strings Validation
**Rule**: If req.query schema exists, validate reqCtx.queryStringParameters against schema  
**Rationale**: Validate query parameter structure and types  
**Enforcement**: Call standard-schema.validate(schema, data)  
**Note**: Type coercion handled by schema library

### RV-6: Validation Order
**Rule**: Validate components in order: body, headers, path, query  
**Rationale**: Consistent validation sequence  
**Enforcement**: Sequential validation calls

### RV-7: Fail Fast
**Rule**: Stop validation on first error  
**Rationale**: Simpler error handling, better performance  
**Enforcement**: Let standard-schema throw error, don't catch

### RV-8: Undefined Components
**Rule**: Pass undefined components to schema validation as-is  
**Rationale**: Schema must explicitly allow undefined if optional  
**Enforcement**: No special handling for undefined

---

## Response Validation Rules

### RSV-1: Body Validation
**Rule**: If res.body schema exists, validate response body against schema  
**Rationale**: Ensure handler returns correct structure  
**Enforcement**: Call standard-schema.validate(schema, data)

### RSV-2: Headers Validation
**Rule**: If res.headers schema exists, validate response headers against schema  
**Rationale**: Ensure handler sets correct headers  
**Enforcement**: Call standard-schema.validate(schema, data)

### RSV-3: Validation Order
**Rule**: Validate components in order: body, headers  
**Rationale**: Consistent validation sequence  
**Enforcement**: Sequential validation calls

### RSV-4: Fail Fast
**Rule**: Stop validation on first error  
**Rationale**: Simpler error handling, better performance  
**Enforcement**: Let standard-schema throw error, don't catch

### RSV-5: Undefined Components
**Rule**: Pass undefined components to schema validation as-is  
**Rationale**: Schema must explicitly allow undefined if optional  
**Enforcement**: No special handling for undefined

### RSV-6: No Automatic Logging
**Rule**: Do not automatically log response validation failures  
**Rationale**: User controls logging via error handler  
**Enforcement**: No logging code in middleware

---

## Error Handling Rules

### EH-1: Error Propagation
**Rule**: Let standard-schema throw errors, do not catch  
**Rationale**: Router's error handler formats errors appropriately  
**Enforcement**: No try/catch in validation logic

### EH-2: Error Details
**Rule**: Use error details provided by standard-schema library  
**Rationale**: Consistent error format across schema libraries  
**Enforcement**: No custom error transformation

### EH-3: Request Validation Errors
**Rule**: Request validation errors result in HTTP 422  
**Rationale**: Client sent invalid data  
**Enforcement**: Router's error handler maps error to HTTP 422

### EH-4: Response Validation Errors
**Rule**: Response validation errors result in HTTP 500  
**Rationale**: Handler returned invalid data (server bug)  
**Enforcement**: Router's error handler maps error to HTTP 500

### EH-5: Error Context
**Rule**: Include component type in error (body, headers, path, query)  
**Rationale**: Help identify which component failed  
**Enforcement**: Wrap standard-schema error with component context

---

## Type Coercion Rules

### TC-1: Delegation to Schema Library
**Rule**: All type coercion handled by schema library  
**Rationale**: Avoid reimplementing coercion logic  
**Enforcement**: Pass raw data to schema validation

### TC-2: Path Parameters
**Rule**: Path parameters passed as-is to schema validation  
**Rationale**: Schema library handles string-to-type coercion  
**Enforcement**: No pre-processing of path parameters

### TC-3: Query Strings
**Rule**: Query strings passed as-is to schema validation  
**Rationale**: Schema library handles string-to-type coercion  
**Enforcement**: No pre-processing of query strings

### TC-4: Headers
**Rule**: Headers passed as-is to schema validation  
**Rationale**: Schema library handles case sensitivity and coercion  
**Enforcement**: No pre-processing of headers

---

## Data Transformation Rules

### DT-1: No Pre-Validation Transformation
**Rule**: Do not transform data before validation  
**Rationale**: Schema library handles all transformations  
**Enforcement**: Pass raw data to schema validation

### DT-2: No Post-Validation Transformation
**Rule**: Do not transform validated data  
**Rationale**: Schema library returns correctly typed data  
**Enforcement**: Return validated data as-is

### DT-3: Type Inference
**Rule**: Use TypeScript generics for type inference  
**Rationale**: Automatic type safety from schemas  
**Enforcement**: Generic type parameters on validation functions

---

## Performance Rules

### PR-1: Parse Configuration Once
**Rule**: Parse configuration at registration time, not per request  
**Rationale**: Avoid repeated parsing overhead  
**Enforcement**: Factory pattern with closure

### PR-2: Fail Fast
**Rule**: Stop validation on first error  
**Rationale**: Avoid unnecessary validation work  
**Enforcement**: Let errors propagate immediately

### PR-3: Minimal Abstraction
**Rule**: Avoid unnecessary helper functions  
**Rationale**: Reduce function call overhead  
**Enforcement**: Direct validation calls

### PR-4: No Logging Overhead
**Rule**: No automatic logging in middleware  
**Rationale**: Avoid logging performance impact  
**Enforcement**: User handles logging via error handler

---

## Security Rules

### SR-1: Trust User Configuration
**Rule**: No validation of user-provided configuration  
**Rationale**: TypeScript provides compile-time safety  
**Enforcement**: No runtime configuration checks

### SR-2: Error Details Delegation
**Rule**: Use schema library's error details  
**Rationale**: Consistent error handling, user controls via error handler  
**Enforcement**: No custom error detail generation

### SR-3: No Automatic Sanitization
**Rule**: Do not automatically sanitize error details  
**Rationale**: User controls sanitization via error handler  
**Enforcement**: Pass through schema library errors

---

## Validation Sequence

### Request Validation Sequence
1. Check if req.body schema exists → validate if exists
2. Check if req.headers schema exists → validate if exists
3. Check if req.path schema exists → validate if exists
4. Check if req.query schema exists → validate if exists
5. Return validated request data

**Stop on first error** (fail fast)

### Response Validation Sequence
1. Check if res.body schema exists → validate if exists
2. Check if res.headers schema exists → validate if exists
3. Return validated response data

**Stop on first error** (fail fast)

---

## Rule Priorities

### High Priority (Must Enforce)
- Fail fast on validation errors
- Delegate to standard-schema library
- No automatic logging
- Parse configuration once

### Medium Priority (Should Enforce)
- Validate in consistent order
- Pass undefined as-is
- No data transformation

### Low Priority (Nice to Have)
- Minimal abstraction
- Performance optimization

---

## Rule Exceptions

### No Exceptions
All rules apply consistently across all validation scenarios. No special cases or exceptions.

---

## Rule Validation

### How to Verify Rules
1. **Configuration Rules**: Review factory function implementation
2. **Validation Rules**: Review validateRequest/validateResponse functions
3. **Error Rules**: Review error propagation (no try/catch)
4. **Type Coercion Rules**: Verify no pre-processing of data
5. **Performance Rules**: Verify factory pattern, no repeated parsing

### Rule Compliance Checklist
- [ ] Configuration accepted without validation
- [ ] Body assumed already parsed
- [ ] All type coercion delegated to schema library
- [ ] Errors propagate without catching
- [ ] No automatic logging
- [ ] Fail fast on first error
- [ ] Configuration parsed once at registration
- [ ] Undefined passed to schema as-is
