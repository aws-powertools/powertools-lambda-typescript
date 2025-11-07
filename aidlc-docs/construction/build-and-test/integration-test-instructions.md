# Integration Test Instructions - Validation Middleware

**Package**: @aws-lambda-powertools/event-handler  
**Date**: 2025-11-07

---

## Purpose

Integration tests validate that the validation middleware works correctly with the Router and other Event Handler components in a complete request/response flow.

---

## Test Scenarios

### Scenario 1: Validation Middleware with Router

**Description**: Validate that middleware integrates with Router route registration and execution

**Test File**: `tests/integration/rest/validation.test.ts`

**Test Cases**:
- Request body validation in route handler
- Response body validation in route handler
- Path parameter validation
- Query parameter validation
- Combined request and response validation
- Error handling returns correct status codes (422, 500)

### Scenario 2: Validation Error Handling

**Description**: Validate that validation errors are properly caught and formatted by Router error handling

**Test Cases**:
- RequestValidationError returns 422 status
- ResponseValidationError returns 500 status
- Error response includes error type and message
- Error details included in development mode

### Scenario 3: Multiple Routes with Validation

**Description**: Validate that validation applies only to configured routes

**Test Cases**:
- Validated routes reject invalid data
- Unvalidated routes accept any data
- Different validation schemas per route

### Scenario 4: Middleware Composition

**Description**: Validate that validation middleware works with other middleware

**Test Cases**:
- Validation middleware with custom middleware
- Middleware execution order
- Error propagation through middleware chain

---

## Setup Integration Test Environment

### Prerequisites

- Build completed successfully
- Unit tests passing
- Node.js runtime available

### No External Services Required

The validation middleware integration tests use mock schemas and don't require external services like databases or APIs.

---

## Run Integration Tests

### 1. Execute Integration Test Suite

From the event-handler package directory:

```bash
npx vitest run tests/integration/rest/validation.test.ts
```

Or run all integration tests:

```bash
npx vitest run tests/integration/
```

### 2. Expected Test Results

**Test Suite**: `Validation Middleware Integration`

Expected test groups:
- ✅ Router Integration (6 tests)
  - Validates request body in route handler
  - Returns 422 on request validation failure
  - Validates response body in route handler
  - Returns 500 on response validation failure
  - Validates path parameters
  - Validates query parameters
  - Validates both request and response

- ✅ Multiple Routes (1 test)
  - Applies validation to specific routes only

- ✅ Middleware Composition (1 test)
  - Works with other middleware

- ✅ Error Handling (1 test)
  - Error includes validation details

**Expected**: 9+ tests pass, 0 failures

### 3. Verify Service Interactions

Integration tests verify:
- ✅ Middleware factory creates valid middleware function
- ✅ Middleware executes before route handler (request validation)
- ✅ Middleware executes after route handler (response validation)
- ✅ Validation errors propagate to Router error handler
- ✅ Router formats validation errors correctly
- ✅ Request context passed correctly through middleware
- ✅ Response returned correctly after validation

---

## Test Output Review

### Successful Integration Test Run

```
✓ tests/integration/rest/validation.test.ts (9)
  ✓ Validation Middleware Integration (9)
    ✓ Router Integration (6)
      ✓ validates request body in route handler
      ✓ returns 422 on request validation failure
      ✓ validates response body in route handler
      ✓ returns 500 on response validation failure
      ✓ validates path parameters
      ✓ validates query parameters
    ✓ Multiple Routes (1)
      ✓ applies validation to specific routes only
    ✓ Middleware Composition (1)
      ✓ works with other middleware
    ✓ Error Handling (1)
      ✓ error includes validation details

Test Files  1 passed (1)
     Tests  9 passed (9)
  Duration  0.85s
```

---

## Troubleshooting

### Integration Tests Fail with Router Errors

**Cause**: Middleware not properly integrated with Router

**Solution**:
1. Verify middleware export in `src/rest/middleware/index.ts`
2. Check that validation middleware follows Middleware type signature
3. Verify error classes exported from `src/rest/index.ts`

### Tests Fail with "Cannot resolve event"

**Cause**: Mock event structure incorrect

**Solution**:
1. Check mock event helper in test file
2. Verify event structure matches APIGatewayProxyEvent
3. Ensure all required fields are present

### Tests Fail with Validation Errors Not Caught

**Cause**: Error handling not working correctly

**Solution**:
1. Verify RequestValidationError and ResponseValidationError extend HttpError
2. Check that errors are thrown (not returned) from middleware
3. Verify Router error handling is configured

### Tests Pass but Coverage Low

**Cause**: Not all code paths tested

**Solution**:
1. Add tests for edge cases
2. Test error scenarios
3. Test all validation components (body, headers, path, query)

---

## Integration Test Coverage

**Target**: All integration points covered

**Covered Scenarios**:
- ✅ Request validation (body, headers, path, query)
- ✅ Response validation (body, headers)
- ✅ Error handling (422, 500)
- ✅ Middleware composition
- ✅ Multiple routes
- ✅ Router integration

---

## Next Steps

After all integration tests pass:
1. Review test coverage report
2. Verify all scenarios tested
3. Proceed to build and test summary
