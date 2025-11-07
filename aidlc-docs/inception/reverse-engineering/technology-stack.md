# Technology Stack

## Programming Languages
- **TypeScript** - 5.x - Primary development language with strict type checking
- **JavaScript** - ES2022+ - Compilation target for both ESM and CommonJS builds
- **Node.js** - 20.x/22.x - Runtime environment for AWS Lambda

## Frameworks
- **AWS Lambda** - Runtime - Serverless function execution environment
- **AWS SDK v3** - Latest - AWS service integrations (peer dependency)
- **Node.js Streams** - Built-in - Response streaming and large payload handling

## Infrastructure
- **AWS API Gateway** - REST and HTTP API event sources
- **AWS Application Load Balancer** - ALB target group integration
- **AWS Lambda Function URLs** - Direct HTTP invocation
- **AWS AppSync** - GraphQL API and subscription events
- **Amazon Bedrock** - AI agent function invocations
- **AWS CloudWatch** - Logging and metrics (via other Powertools packages)
- **AWS X-Ray** - Distributed tracing (via Tracer package)

## Build Tools
- **npm** - 10.x - Package management and workspace orchestration
- **TypeScript Compiler** - 5.x - Type checking and JavaScript compilation
- **Biome** - 1.x - Code linting, formatting, and static analysis
- **Vitest** - 2.x - Unit testing framework with coverage reporting
- **TypeDoc** - 0.x - API documentation generation from TypeScript

## Testing Tools
- **Vitest** - 2.x - Primary testing framework with built-in coverage
- **AWS SDK Client Mock** - 4.x - AWS service mocking for tests
- **Sinon** - 18.x - Test spies, stubs, and mocks
- **Chai** - 5.x - Assertion library for tests

## Development Tools
- **Husky** - 9.x - Git hooks for pre-commit validation
- **Markdownlint** - 0.x - Markdown linting for documentation
- **MkDocs** - 1.x - Documentation site generation
- **Docker** - Latest - Documentation development environment

## Package Management
- **npm Workspaces** - Monorepo management
- **Semantic Versioning** - Automated version management
- **Changesets** - Release management and changelog generation

## Type System
- **TypeScript Strict Mode** - Full strict type checking enabled
- **Generic Types** - Extensive use for type safety and reusability
- **Discriminated Unions** - Type-safe event source handling
- **Template Literal Types** - Path pattern type safety
- **Conditional Types** - Advanced type transformations

## Validation Technologies (Current State)

### JSON Schema (Validation Package)
- **AJV** - 8.x - JSON Schema validation engine
- **JSON Schema Draft 7** - Schema specification standard
- **JMESPath** - Event unwrapping and data extraction

### Zod (Parser Package)
- **Zod** - 3.x - TypeScript-first schema validation
- **Type Inference** - Automatic TypeScript type generation
- **Runtime Validation** - Schema validation with type safety

## Standard Schema Ecosystem (Target for Issue #4516)

### Standard Schema Specification
- **Standard Schema** - Universal schema specification
- **Cross-library Compatibility** - Works with Zod, Valibot, ArkType, etc.
- **Type Safety** - First-class TypeScript support

### Compatible Libraries
- **Zod** - 3.23+ - Standard Schema compatible
- **Valibot** - 0.x - Lightweight Standard Schema library
- **ArkType** - 2.x - High-performance runtime validation
- **Yup** - Future versions - Planning Standard Schema support

## Build Configuration

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./lib"
  }
}
```

### Package.json Scripts
- **build**: Dual ESM/CommonJS compilation
- **test**: Unit test execution with coverage
- **lint**: Code quality checking and formatting
- **prepack**: Release preparation and package.json patching

### Export Configuration
- **Dual Package Hazard**: Avoided with proper package.json configuration
- **Conditional Exports**: ESM/CommonJS compatibility
- **Type Exports**: Separate type-only imports supported

## Runtime Dependencies

### Production Dependencies
- **@aws-lambda-powertools/commons** - 2.28.1 - Shared utilities
- **Node.js Built-ins** - stream, stream/promises, util

### Peer Dependencies
- **aws-lambda** - ^1.0.7 - AWS Lambda type definitions
- **@types/aws-lambda** - ^8.10.145 - TypeScript definitions

### Development Dependencies
- **TypeScript** - ^5.6.3 - Type checking and compilation
- **Vitest** - ^2.1.4 - Testing framework
- **Biome** - ^1.9.4 - Linting and formatting

## Performance Considerations

### Bundle Size Optimization
- **Tree Shaking** - ESM modules for optimal bundling
- **Modular Exports** - Import only needed functionality
- **Zero Dependencies** - Minimal runtime dependencies

### Runtime Performance
- **Route Compilation** - Pre-compiled regex patterns for path matching
- **Middleware Composition** - Efficient function composition
- **Streaming Support** - Large response handling without memory issues

### Memory Management
- **Event Pooling** - Reuse of event objects where possible
- **Lazy Loading** - On-demand module loading
- **Garbage Collection** - Proper cleanup of resources

## Security Considerations

### Input Validation
- **Type Safety** - Compile-time type checking
- **Runtime Validation** - Schema-based validation (target for #4516)
- **Path Traversal Protection** - Safe path parameter handling

### Error Handling
- **Information Disclosure** - Controlled error responses
- **Stack Trace Sanitization** - Production-safe error handling
- **Custom Error Types** - Structured error responses

### Dependencies
- **Minimal Attack Surface** - Few external dependencies
- **Regular Updates** - Automated dependency updates
- **Security Scanning** - Automated vulnerability detection
