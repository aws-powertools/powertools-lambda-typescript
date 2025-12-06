# Validation Middleware Examples

These examples demonstrate how to use the validation middleware with the Event Handler REST router.

## Prerequisites

Install the required dependencies:

```bash
npm install @aws-lambda-powertools/event-handler zod @standard-schema/spec
```

## Examples

### Basic Validation (`validation_basic.ts`)

Shows how to:
- Validate request body with Zod schema
- Validate both request and response
- Get type inference from schemas

### Query and Headers Validation (`validation_query_headers.ts`)

Shows how to:
- Validate query parameters
- Validate request headers
- Validate multiple request components together
- Use schema transformations

### Error Handling (`validation_error_handling.ts`)

Shows how to:
- Handle validation errors with custom error handlers
- Access validation error details
- Provide different error responses in development vs production

## Supported Schema Libraries

The validation middleware supports any library that implements the Standard Schema specification:

- **Zod** (v3.x) - Shown in these examples
- **Valibot** (v1.x) - TypeScript-first schema library
- **ArkType** (v2.x) - Type-first runtime validation

## Usage with Other Schema Libraries

### Valibot Example

```typescript
import * as v from 'valibot';

const userSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
});

app.post('/users', {
  middleware: [validation({ req: { body: userSchema } })],
}, async (reqCtx) => {
  // ...
});
```

### ArkType Example

```typescript
import { type } from 'arktype';

const userSchema = type({
  name: 'string',
  'email': 'string.email',
});

app.post('/users', {
  middleware: [validation({ req: { body: userSchema } })],
}, async (reqCtx) => {
  // ...
});
```

## Error Responses

### Request Validation Failure (422)

```json
{
  "statusCode": 422,
  "error": "RequestValidationError",
  "message": "Validation failed for request body"
}
```

### Response Validation Failure (500)

```json
{
  "statusCode": 500,
  "error": "ResponseValidationError",
  "message": "Validation failed for response body"
}
```

## Development Mode

Set `POWERTOOLS_DEV=true` to include detailed validation errors in responses:

```json
{
  "statusCode": 422,
  "error": "RequestValidationError",
  "message": "Validation failed for request body",
  "details": {
    "validationError": "Expected string, received number"
  }
}
```
