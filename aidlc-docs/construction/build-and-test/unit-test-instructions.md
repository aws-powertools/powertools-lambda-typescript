# Unit Test Execution - Validation Middleware

**Package**: @aws-lambda-powertools/event-handler  
**Date**: 2025-11-07

---

## Unit Test Overview

Unit tests validate individual components in isolation:
- **Validation Types**: Type definitions and interfaces
- **Validation Errors**: RequestValidationError and ResponseValidationError
- **Validation Middleware**: Factory function and validation logic

**Test Files**:
- `tests/unit/rest/validation-errors.test.ts` - Error class tests
- `tests/unit/rest/middleware/validation.test.ts` - Middleware tests

---

## Run Unit Tests

### 1. Execute All Unit Tests

From the event-handler package directory:

```bash
npm run test:unit
```

Or run specific test files:

```bash
# Test validation errors only
npx vitest run tests/unit/rest/validation-errors.test.ts

# Test validation middleware only
npx vitest run tests/unit/rest/middleware/validation.test.ts
```

### 2. Run Tests with Coverage

```bash
npm run test:unit:coverage
```

This generates a coverage report showing which lines of code are tested.

### 3. Run Tests in Watch Mode (Development)

```bash
npx vitest tests/unit/rest/validation-errors.test.ts tests/unit/rest/middleware/validation.test.ts
```

This watches for file changes and reruns tests automatically.

---

## Expected Test Results

### Validation Errors Tests

**Test Suite**: `Validation Error Classes`

Expected tests:
- ✅ RequestValidationError creates error with correct statusCode (422)
- ✅ RequestValidationError creates error with correct errorType
- ✅ RequestValidationError stores component information
- ✅ RequestValidationError stores original error
- ✅ RequestValidationError includes validation error in details when POWERTOOLS_DEV is true
- ✅ RequestValidationError excludes validation error details when POWERTOOLS_DEV is false
- ✅ RequestValidationError supports all request components (body, headers, path, query)
- ✅ RequestValidationError converts to JSON response
- ✅ ResponseValidationError creates error with correct statusCode (500)
- ✅ ResponseValidationError creates error with correct errorType
- ✅ ResponseValidationError stores component information
- ✅ ResponseValidationError stores original error
- ✅ ResponseValidationError includes validation error in details when POWERTOOLS_DEV is true
- ✅ ResponseValidationError excludes validation error details when POWERTOOLS_DEV is false
- ✅ ResponseValidationError supports all response components (body, headers)
- ✅ ResponseValidationError converts to JSON response

**Expected**: 16 tests pass, 0 failures

### Validation Middleware Tests

**Test Suite**: `Validation Middleware`

Expected test groups:
- ✅ Factory Function (5 tests)
- ✅ Request Body Validation (3 tests)
- ✅ Request Headers Validation (3 tests)
- ✅ Request Path Validation (3 tests)
- ✅ Request Query Validation (3 tests)
- ✅ Multiple Request Component Validation (2 tests)
- ✅ Response Body Validation (3 tests)
- ✅ Response Headers Validation (2 tests)
- ✅ Configuration Scenarios (4 tests)

**Expected**: 28+ tests pass, 0 failures

---

## Test Coverage Expectations

**Target Coverage**: 100% for new validation code

**Files to Cover**:
- `src/rest/middleware/validation.ts` - 100%
- `src/rest/errors.ts` (validation errors only) - 100%
- `src/types/rest.ts` (validation types) - N/A (types only)

**Coverage Report Location**: `coverage/` directory

---

## Troubleshooting

### Tests Fail with Import Errors

**Cause**: Build artifacts not generated or outdated

**Solution**:
```bash
npm run build
npm run test:unit
```

### Tests Fail with Type Errors

**Cause**: TypeScript compilation issues

**Solution**:
1. Check that build completed successfully
2. Verify all type definitions are correct
3. Run `npm run build` then `npm run test:unit`

### Tests Fail with "Cannot find module"

**Cause**: Missing test dependencies or incorrect imports

**Solution**:
```bash
# Reinstall dependencies
npm install
npm run test:unit
```

### Specific Test Failures

**RequestValidationError tests fail**:
- Check error class implementation in `src/rest/errors.ts`
- Verify statusCode is 422
- Verify POWERTOOLS_DEV environment variable handling

**ResponseValidationError tests fail**:
- Check error class implementation in `src/rest/errors.ts`
- Verify statusCode is 500
- Verify component types (body, headers only)

**Middleware tests fail**:
- Check middleware implementation in `src/rest/middleware/validation.ts`
- Verify Standard Schema validation logic
- Check error throwing behavior

---

## Review Test Output

### Successful Test Run

```
✓ tests/unit/rest/validation-errors.test.ts (16)
  ✓ Validation Error Classes (16)
    ✓ RequestValidationError (8)
    ✓ ResponseValidationError (8)

✓ tests/unit/rest/middleware/validation.test.ts (28)
  ✓ Validation Middleware (28)
    ✓ Factory Function (5)
    ✓ Request Body Validation (3)
    ✓ Request Headers Validation (3)
    ✓ Request Path Validation (3)
    ✓ Request Query Validation (3)
    ✓ Multiple Request Component Validation (2)
    ✓ Response Body Validation (3)
    ✓ Response Headers Validation (2)
    ✓ Configuration Scenarios (4)

Test Files  2 passed (2)
     Tests  44 passed (44)
  Start at  16:25:40
  Duration  1.23s
```

### Failed Test Run

If tests fail, review the error output:
1. Identify which test failed
2. Review the assertion that failed
3. Check the implementation code
4. Fix the issue
5. Rerun tests

---

## Next Steps

After all unit tests pass:
1. Proceed to integration test execution
2. Verify middleware works with Router
3. Test error handling through error registry
