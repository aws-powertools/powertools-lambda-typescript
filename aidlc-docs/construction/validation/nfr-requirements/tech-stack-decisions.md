# Tech Stack Decisions - Validation Middleware

**Unit**: Event Handler Validation  
**Date**: 2025-11-07

---

## Overview

This document records technology choices and rationale for the validation middleware implementation.

---

## Core Dependencies

### standard-schema Package

**Decision**: Use `standard-schema` as the validation abstraction layer

**Rationale**:
- Provides unified interface for multiple schema libraries
- Enables support for Zod, Valibot, and ArkType
- Avoids vendor lock-in to single schema library
- Community-driven specification

**Version**: Latest stable version

**Dependency Type**: Production dependency (required)

**Alternatives Considered**:
- Direct Zod integration: Rejected (vendor lock-in)
- Custom abstraction layer: Rejected (unnecessary complexity)
- No abstraction: Rejected (can't support multiple libraries)

**Risk**: Standard Schema specification changes
**Mitigation**: Monitor specification, update as needed

---

## Peer Dependencies

### Zod

**Decision**: Zod as peer dependency (user installs)

**Rationale**:
- Popular TypeScript-first schema library
- Excellent type inference
- User choice to install

**Version**: `^3.x` (compatible versions)

**Dependency Type**: Peer dependency (optional)

**Installation**: User installs if using Zod

---

### Valibot

**Decision**: Valibot as peer dependency (user installs)

**Rationale**:
- Lightweight alternative to Zod
- Good performance characteristics
- User choice to install

**Version**: `^0.x` (compatible versions)

**Dependency Type**: Peer dependency (optional)

**Installation**: User installs if using Valibot

---

### ArkType

**Decision**: ArkType as peer dependency (user installs)

**Rationale**:
- Type-first validation library
- Unique approach to schemas
- User choice to install

**Version**: `^2.x` (compatible versions)

**Dependency Type**: Peer dependency (optional)

**Installation**: User installs if using ArkType

---

## TypeScript Configuration

### TypeScript Version

**Decision**: Support TypeScript 4.x and 5.x

**Rationale**:
- Match Powertools compatibility
- Support current and recent versions
- Enable modern TypeScript features

**Minimum Version**: TypeScript 4.5 (for template literal types)

**Testing**: Test with TypeScript 4.x and 5.x

---

### Strict Mode

**Decision**: Code must be compatible with TypeScript strict mode

**Rationale**:
- Maximum type safety
- Catch errors at compile time
- Best practice for TypeScript libraries

**Configuration**:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

---

### Type Inference Strategy

**Decision**: Use TypeScript generics for automatic type inference

**Rationale**:
- No custom type utilities needed
- Leverage TypeScript built-in inference
- Simpler implementation

**Implementation**:
```typescript
function validation<TReq, TRes>(
  config: ValidationConfig<TReq, TRes>
): MiddlewareFunction
```

**Alternatives Considered**:
- Custom type utilities: Rejected (unnecessary complexity)
- Manual type annotations: Rejected (poor developer experience)

---

## Node.js Compatibility

### Node.js Versions

**Decision**: Support Node.js 20 and 22

**Rationale**:
- Match Powertools platform support
- AWS Lambda supported runtimes
- Modern JavaScript features available

**Testing**: Test with Node 20 and 22

**Minimum Version**: Node.js 20.x

---

### ECMAScript Target

**Decision**: Compile to ES2022

**Rationale**:
- Supported by Node 20+
- Modern JavaScript features
- Smaller bundle size

**Configuration**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022"
  }
}
```

---

## Build and Packaging

### Build Tool

**Decision**: Use existing Powertools build system (likely TypeScript compiler + bundler)

**Rationale**:
- Consistency with other Powertools packages
- Proven build pipeline
- No additional tooling needed

**Output**: CommonJS and ESM modules

---

### Package Structure

**Decision**: Part of `@aws-lambda-powertools/event-handler` package

**Rationale**:
- Validation is Event Handler feature
- No separate package needed
- Simpler dependency management

**Location**: `packages/event-handler/src/rest/middleware/validation.ts`

---

## Testing Stack

### Test Framework

**Decision**: Use existing Powertools test framework (likely Jest)

**Rationale**:
- Consistency with other packages
- Proven testing setup
- Good TypeScript support

---

### Test Coverage

**Decision**: Comprehensive test coverage required

**Test Types**:
- Unit tests: Validation logic
- Integration tests: Schema library integration (Zod, Valibot, ArkType)
- Type tests: Type inference validation
- Error tests: Error handling and propagation

**Coverage Target**: Follow Powertools standards

---

### Performance Tests

**Decision**: Benchmark validation performance

**Rationale**: Understand overhead, optimize if needed

**Benchmarks**:
- Validation overhead per request
- Configuration parsing time
- Schema validation time (per library)

**Tools**: Benchmark.js or similar

---

## Documentation Stack

### API Documentation

**Decision**: Standard documentation approach

**Format**: Markdown documentation in docs/

**Content**:
- API reference
- Basic usage examples
- Error handling guide
- Type inference examples

**Tools**: Existing Powertools documentation system

---

### Code Comments

**Decision**: Inline comments for complex logic

**Style**: JSDoc for public APIs

**Coverage**: Public interfaces, complex algorithms

---

## Development Environment

### Environment Variables

**Decision**: Support `POWERTOOLS_DEV` for development mode

**Behavior**:
- `POWERTOOLS_DEV=true`: Full error details
- `POWERTOOLS_DEV=false` or unset: Minimal error details

**Rationale**: Control error exposure based on environment

**Implementation**: Check environment variable in error handling

---

### IDE Support

**Decision**: Full TypeScript IDE support

**Requirements**:
- Type inference in IDEs (VS Code, WebStorm, etc.)
- Autocomplete for validated data
- Error highlighting

**Implementation**: Proper TypeScript types and generics

---

## Deployment Considerations

### Lambda Environment

**Decision**: Optimized for AWS Lambda

**Considerations**:
- Cold start impact (minimal - factory pattern)
- Memory usage (minimal - lean data structures)
- Execution time (fail fast, no unnecessary work)

**Testing**: Test in Lambda environment

---

### Bundle Size

**Decision**: Minimal bundle size impact

**Strategy**:
- No unnecessary dependencies
- Tree-shakeable code
- Peer dependencies (user installs schema library)

**Measurement**: Track bundle size impact

---

## Security Considerations

### Dependency Security

**Decision**: Minimal dependencies to reduce attack surface

**Dependencies**:
- Production: `standard-schema` only
- Peer: User-installed schema libraries

**Monitoring**: Dependabot for security updates

---

### Error Information

**Decision**: Environment-based error detail exposure

**Implementation**: Check `POWERTOOLS_DEV` environment variable

**Default**: Minimal error details (production-safe)

---

## Tech Stack Summary

| Category | Technology | Version | Type | Rationale |
|----------|-----------|---------|------|-----------|
| Validation Abstraction | standard-schema | Latest | Production | Multi-library support |
| Schema Library (Zod) | zod | ^3.x | Peer | User choice |
| Schema Library (Valibot) | valibot | ^0.x | Peer | User choice |
| Schema Library (ArkType) | arktype | ^2.x | Peer | User choice |
| Language | TypeScript | 4.x, 5.x | Dev | Type safety |
| Runtime | Node.js | 20, 22 | Runtime | Lambda support |
| Build Target | ES2022 | - | Build | Modern features |
| Test Framework | Jest (existing) | - | Dev | Consistency |
| Documentation | Markdown | - | Dev | Standard format |

---

## Decision Rationale Summary

### Why standard-schema?
- Multi-library support without vendor lock-in
- Community-driven specification
- Unified interface

### Why Peer Dependencies?
- User choice of schema library
- Smaller bundle size
- No forced dependencies

### Why TypeScript Strict Mode?
- Maximum type safety
- Catch errors early
- Best practice

### Why No Custom Type Utilities?
- TypeScript built-in inference sufficient
- Simpler implementation
- Less maintenance

### Why No Built-in Monitoring?
- User controls monitoring strategy
- Flexibility
- No opinionated behavior

### Why Experimental Status?
- Allow iteration and improvements
- No backward compatibility constraints
- Gather user feedback

---

## Future Considerations

### Potential Additions
- Additional schema library support (if Standard Schema compatible)
- Performance optimizations (if benchmarks show issues)
- Enhanced error formatting (if user feedback requests)

### Stabilization Criteria
- User feedback positive
- No major issues reported
- API stable for 6+ months
- Comprehensive test coverage maintained

### Post-Stabilization
- Semantic versioning enforcement
- Backward compatibility guarantees
- Deprecation policy for breaking changes
