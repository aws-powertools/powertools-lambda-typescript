# Application Design Plan - Follow-up Clarifications

**Date**: 2025-11-07

---

## Follow-up 1: Type Inference Utilities (Q4)

**Your Answer**: "Ideally D, B if necessary"

**Clarification Needed**: When would B (integrated into ValidationMiddleware) be necessary vs using D (TypeScript built-in inference)?

A) Use D (built-in inference) always, B is not needed  
B) Use D for simple cases, B for complex type transformations  
C) Start with D, add B only if type inference issues arise during implementation  
X) Other (please specify)

[Answer]: C

---

## Follow-up 2: Backward Compatibility (Q7)

**Your Answer**: "Go with the new interface"

**Clarification Needed**: Does this mean:

A) No backward compatibility - remove support for `input`/`output` configuration entirely  
B) Support both old (`input`/`output`) and new (`req`/`res`) interfaces  
C) Deprecate old interface but keep it working with a warning  
D) Only support new interface, document migration path  
X) Other (please specify)

[Answer]: A

---

## Follow-up 3: Existing Granularity Analysis (Q8)

**Your Answer**: "Look at ./packages/event-handler/src/rest in the project repo and follow similar level of granularity"

**Context**: I've analyzed the existing Event Handler REST structure. It uses:
- Separate files for Router, Route, RouteHandlerRegistry, ErrorHandlerRegistry
- Middleware in separate directory with individual files (cors.ts, compress.ts)
- Utilities in utils.ts
- Errors in errors.ts
- Types in types.ts

**Clarification**: Should the validation system follow this pattern with:

A) Separate files: ValidationMiddleware.ts, ValidationConfig.ts, ValidationErrors.ts, types.ts  
B) Single validation.ts file with all validation logic  
C) Validation directory with: middleware.ts, config.ts, errors.ts, types.ts  
X) Other (please specify)

[Answer]: X - The middleware should go in middleware folder, errors under existing errors.ts, types in types.ts

---

## Instructions

Please answer these 3 follow-up questions, then respond with **"Follow-up answered"** and I will generate the application design artifacts.
