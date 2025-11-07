# Requirements Verification - Follow-up Questions

**Date**: 2025-11-07  
**Status**: Awaiting Clarifications

Based on your initial answers and RFC #3500, I need clarification on a few points:

---

## Follow-up 1: Validation Scope (Question 1)

**Your Answer**: "Look at the RFC #3500 for the answer"

**RFC Context Found**: The RFC shows validation for:
- Request body (input schema)
- Response body (output schema)
- Path parameters (via dynamic routes like `/todos/:todoId`)
- Query strings (via `app.currentEvent.query()`)
- Headers (via `app.currentEvent.headers`)

**Clarification Needed**: Based on the RFC, should validation support:

A) Request body and response body only (as shown in validation examples)  
B) Request body, response body, and path parameters  
C) Request body, response body, path parameters, and query parameters  
D) Request body, response body, path parameters, query parameters, and headers (all aspects shown in RFC)  

[Answer]: A

---

## Follow-up 2: Error Handling (Question 4)

**Your Answer**: "There's already an error handling mechanism for event handler, based on the previous question, I want different HTTP errors depending on the validation"

**RFC Context**: The RFC shows:
- Request validation failures return HTTP 422 (Unprocessable Entity)
- Custom error handling via `RequestValidationError` exception

**Clarification Needed**: Should the implementation use:

A) HTTP 422 for all validation failures (request body, response, headers, query params, path params)  
B) HTTP 400 for request validation (body, headers, query, path) and HTTP 500 for response validation  
C) HTTP 400 for client errors (body, headers, query, path) and HTTP 422 for schema validation specifically  
D) Different codes: 400 for body, 400 for headers, 400 for query params, 404 for path params, 500 for response  
X) Other (please specify exact HTTP status codes for each validation type)

[Answer]: X - See answer to follow up question 1

---

## Follow-up 3: Testing Support (Question 15)

**Your Answer**: "Didn't understand the question"

**Clarification**: The question asks what testing utilities should be provided to help developers test their validated routes.

**Options**:
A) No special testing utilities needed - developers use standard testing approaches  
B) Provide helper functions to create mock requests with validation schemas  
C) Provide utilities to test that schemas are correctly applied to routes  
D) Provide example test files showing how to test validated routes  
X) Other (please specify)

[Answer]: A

---

## Follow-up 4: Validation Timing Clarification (Question 3)

**Your Answer**: "As a middleware but both before for the request and after for the response"

**Clarification**: Should this be:

A) A single middleware that validates both request (before handler) and response (after handler)  
B) Two separate middlewares - one for request validation, one for response validation  
C) Configurable - developers can choose to validate request only, response only, or both  

[Answer]: A and C

---

## Follow-up 5: Standard Schema vs RFC Implementation

**RFC Context**: The RFC shows examples using Zod specifically, with code like:
```ts
const todoSchema = z.object({
  userId: z.number(),
  title: z.string(),
  completed: z.boolean()
});
```

**Your Answer to Q2**: Support ONLY Standard Schema-compatible libraries

**Clarification**: Should the implementation:

A) Use Standard Schema as shown in RFC (Zod, Valibot, ArkType via standard-schema abstraction)  
B) Start with Zod only (as shown in RFC examples) and add Standard Schema support later  
C) Build Standard Schema support from the start to support multiple libraries  

[Answer]: A

---

## Next Steps

Please answer these 5 follow-up questions, then respond with "Follow-up answered" and I will generate the complete requirements document.
