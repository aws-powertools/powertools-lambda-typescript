# Coding standards

Reference for writing code and tests in this repo. Rules are grouped by concern; apply every rule in the section that matches your task.

## Project layout and imports

- The codebase is TypeScript, ESM. Each utility lives in `packages/<package-name>` with `src` for source and `test` for tests.
- Import across packages by package name (`import { myFunction } from '@aws-lambda-powertools/commons'`), with the dependency declared in the importing package's `package.json`. Relative paths stay within a package and always carry the `.js` extension (`from './utils.js'`).
- Utilities and types shared by two or more packages belong in `@aws-lambda-powertools/commons`.
- Sibling-package dependencies (including peerDependencies) are exact pins matching the current lockstep version (`"@aws-lambda-powertools/commons": "2.35.0"`), no range specifiers.

## Package anatomy

Conventions inside each package:

- **Errors** live in a per-package `errors.ts`; classes carry the `Error` suffix (`IdempotencyKeyError`) and extend the package's base error.
- **Constants** live in a per-package `constants.ts` as `as const` objects, in place of TS enums.
- **Environment variables** are read through the commons helpers — `getStringFromEnv`, `getNumberFromEnv`, `getBooleanFromEnv` from `@aws-lambda-powertools/commons/utils/env` — rather than `process.env`.
- **AWS SDK clients** get the Powertools user agent at construction: `addUserAgentMiddleware(client, '<feature>')` from commons.
- **New public entry points** (packages build dual ESM/CJS) require entries in both the `exports` map and `typesVersions` in the package's `package.json`.

## TypeScript style

Match the existing style of the surrounding code. House conventions:

- `const` by default; `let` only for reassignment.
- `async/await` for asynchronous code.
- `for...of` for array iteration; `Object.entries` / `Object.keys` / `Object.values` for object iteration.
- Specific types first, `unknown` when the type is genuinely unknown, `any` only when unavoidable.
- Fix type errors at their source; a cast (`as Type`, and especially `as unknown as Type`) is a last resort for genuine boundaries, paired with a comment explaining why it's safe.
- `import type` / `export type` for type-only imports and exports.
- `null` means the absence of a value; `undefined` means a value not yet set or initialized. Pick the one that matches the meaning.
- Descriptive, spelled-out names; readability over cleverness.
- To suppress a type error, use `@ts-expect-error` with a reason (`@ts-ignore` is a lint error).
- Biome organizes imports on save/commit; leave import ordering to it.

## JSDoc

Document functions, classes, and types with a single JSDoc block per symbol — public APIs always, internal ones too.

- Open with one active-voice sentence ending in a period (`Gets the user by ID.`), then longer detail as needed.
- `@param name - the name of the user`: active voice, no type annotation. For option objects: `@param {Object} options` then `@param {string} options.name - the name of the user`.
- `@example` to show usage.
- Link symbols as `{@link functionName | `functionName`}` — backticks mandatory for docs rendering.
- `@internal` marks symbols outside the public API; `@deprecated` always carries a reason and an alternative.
- Skip `@returns` and `@throws`.

## Verification

Run from the repo root with `-w <workspace>`, or from the package directory:

- `npm run lint` to check; `npm run lint:fix` to auto-fix (review its changes).
- `npm run build:tests` to type-check source and tests without emitting — CI compiles them separately from running them. `npm run build` additionally compiles the CommonJS target.

## Unit tests

Tests use `vitest` and live in each package's `test` directory. Run with `npm run test:unit -w packages/<name>` (or `npm run test:unit` from the package directory). Write unit tests only — end-to-end tests happen when the user asks for them.

Coverage: CI enforces 100% coverage on `src/**` (types files excluded) via `npm run test:unit:coverage` — the plain test run skips coverage, so verify with the `:coverage` variant before finishing. Every new source line needs a covering test.

Structure:

- One behavior per test case. Use `it.each` to cover input variations of the same behavior.
- Nest `describe` blocks at most one level deep.
- Name tests in active voice, no conditional: `it('throws an error when input is invalid')`.
- Delimit each test into phases with comments: `// Prepare` (setup), `// Act` (execute), `// Assess` (verify).
- Commit every test enabled: `it.only` and `.skip` are lint errors.

Assertions:

- Verify results with `expect` assertions on observable behavior.
- Each assertion tests something meaningful; test behavior, and reach private methods only by extending the class in the test to expose them.
- Custom matchers from `packages/testing/src/setupEnv.ts`: `toHaveLogged`, `toHaveLoggedNth`, `toHaveEmittedEMFWith`, `toHaveEmittedNthEMFWith`, `toHaveEmittedMetricWith`, `toHaveEmittedNthMetricWith`, plus `toReceiveCommandWith` for mocked AWS SDK clients.

Environment:

- Keep test cases isolated from each other.
- `vi.mock` sparingly, for external dependencies only.
- `console` is pre-mocked: use it freely in code under test and in assertions.
- Set env vars with `vi.stubEnv()` and restore with `vi.unstubAllEnvs()` in `beforeEach`/`afterEach`; setupEnv pre-sets the standard Lambda env vars.

When unsure, copy the pattern of an existing test in the same package.

## Documentation

Feature work updates the MkDocs site in `docs/features/<utility>.md`. Code examples are real TypeScript files in `examples/snippets/<utility>/`, included via `--8<--` snippet syntax — `examples/snippets` is a workspace that CI lints and type-checks, so every doc example must compile.
