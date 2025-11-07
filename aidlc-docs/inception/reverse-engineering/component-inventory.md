# Component Inventory

## Application Packages
- **@aws-lambda-powertools/event-handler** - Main event handling and routing package
- **@aws-lambda-powertools/logger** - Structured logging utilities
- **@aws-lambda-powertools/metrics** - Custom metrics via CloudWatch EMF
- **@aws-lambda-powertools/tracer** - Distributed tracing utilities
- **@aws-lambda-powertools/parameters** - Parameter store and secrets management
- **@aws-lambda-powertools/idempotency** - Idempotent function execution
- **@aws-lambda-powertools/batch** - Batch processing utilities
- **@aws-lambda-powertools/parser** - Event parsing with Zod schemas
- **@aws-lambda-powertools/validation** - JSON Schema validation utilities
- **@aws-lambda-powertools/kafka** - Kafka event processing utilities

## Infrastructure Packages
- **layers** - CDK constructs for Lambda layers deployment
- **examples/app** - CDK application examples and templates

## Shared Packages
- **@aws-lambda-powertools/commons** - Shared utilities and type definitions
- **@aws-lambda-powertools/jmespath** - JMESPath query utilities
- **@aws-lambda-powertools/testing** - Testing utilities and mocks

## Test Packages
- **examples/snippets** - Code examples and documentation snippets
- **packages/*/tests** - Unit and integration tests for each package

## Event Handler Package Components

### Core Modules
- **rest** - REST API routing and handling (experimental)
- **appsync-graphql** - AppSync GraphQL field resolvers
- **appsync-events** - AppSync subscription event handling
- **bedrock-agent** - Amazon Bedrock Agent function handling
- **types** - TypeScript type definitions

### REST Module Components
- **Router.ts** - Main routing class with HTTP method support
- **Route.ts** - Individual route representation
- **RouteHandlerRegistry.ts** - Route storage and matching
- **ErrorHandlerRegistry.ts** - Error handler management
- **converters.ts** - Event/response format conversion
- **utils.ts** - Utility functions and helpers
- **errors.ts** - HTTP error classes
- **constants.ts** - HTTP constants and enums
- **middleware/** - Built-in middleware implementations
  - **cors.ts** - CORS handling middleware
  - **compress.ts** - Response compression middleware

### AppSync GraphQL Components
- **Router.ts** - GraphQL field resolver routing
- **AppSyncGraphQLResolver.ts** - Main resolver class
- **RouteHandlerRegistry.ts** - Field resolver registry
- **ExceptionHandlerRegistry.ts** - GraphQL exception handling
- **scalarTypesUtils.ts** - Scalar type transformations
- **utils.ts** - GraphQL-specific utilities
- **errors.ts** - GraphQL error classes

### AppSync Events Components
- **Router.ts** - Event subscription routing
- **AppSyncEventsResolver.ts** - Event resolver class
- **RouteHandlerRegistry.ts** - Event handler registry
- **utils.ts** - Event processing utilities
- **errors.ts** - Event-specific errors

### Bedrock Agent Components
- **BedrockAgentFunctionResolver.ts** - Function call resolver
- **BedrockFunctionResponse.ts** - Response formatting
- **utils.ts** - Bedrock-specific utilities

### Type Definitions
- **common.ts** - Shared type definitions
- **rest.ts** - REST API specific types
- **appsync-graphql.ts** - GraphQL specific types
- **appsync-events.ts** - AppSync Events types
- **bedrock-agent.ts** - Bedrock Agent types

## Related Powertools Packages (Validation Context)

### Existing Validation Package
- **@aws-lambda-powertools/validation** - JSON Schema validation
  - Uses AJV for JSON Schema validation
  - Provides decorators and middleware
  - Supports JMESPath for event unwrapping
  - Currently separate from Event Handler

### Parser Package (Zod Integration)
- **@aws-lambda-powertools/parser** - Zod-based parsing
  - Uses Zod for TypeScript-first schema validation
  - Provides event parsing utilities
  - Type-safe parsing with inference
  - Could be model for Standard Schema integration

## Total Count
- **Total Packages**: 16
- **Application**: 10 (core Powertools utilities)
- **Infrastructure**: 2 (layers, examples/app)
- **Shared**: 3 (commons, jmespath, testing)
- **Test/Examples**: 1 (examples/snippets)

## Event Handler Module Count
- **Total Modules**: 4 (rest, appsync-graphql, appsync-events, bedrock-agent)
- **REST Components**: 9 core files + 2 middleware
- **AppSync GraphQL Components**: 8 files
- **AppSync Events Components**: 6 files
- **Bedrock Agent Components**: 4 files
- **Shared Components**: 5 type definition files

## Dependencies Analysis

### Internal Dependencies
- **@aws-lambda-powertools/commons**: Used by all Event Handler modules
- **@aws-lambda-powertools/validation**: Separate validation package (potential integration target)
- **@aws-lambda-powertools/parser**: Zod-based parsing (Standard Schema compatible)

### External Dependencies
- **aws-lambda**: AWS Lambda type definitions (peer dependency)
- **Node.js built-ins**: stream, stream/promises for response streaming
- **TypeScript**: Development and build-time dependency

### Build Dependencies
- **TypeScript**: Compilation and type checking
- **Vitest**: Testing framework
- **Biome**: Linting and formatting
- **TypeDoc**: API documentation generation

## Package Export Structure
```
@aws-lambda-powertools/event-handler/
├── appsync-events          # AppSync Events module
├── appsync-graphql         # AppSync GraphQL module  
├── bedrock-agent           # Bedrock Agent module
├── types                   # Type definitions only
├── experimental-rest       # REST API module (experimental)
└── experimental-rest/middleware  # Built-in middleware
```

## Test Coverage Structure
- **Unit Tests**: Mirror source structure in tests/unit/
- **Test Helpers**: Shared test utilities in tests/helpers/
- **Test Events**: Sample Lambda events in tests/events/
- **Coverage Reporting**: 100% coverage threshold for critical paths
- **Test Organization**: Separate test files for each source module
