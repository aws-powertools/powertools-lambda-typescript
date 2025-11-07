# Build Instructions - Validation Middleware

**Package**: @aws-lambda-powertools/event-handler  
**Date**: 2025-11-07

---

## Prerequisites

### Build Tools
- **Node.js**: v20.x or v22.x
- **npm**: v10.x or higher
- **TypeScript**: v5.x (installed via dependencies)

### Dependencies
All dependencies are managed via npm and defined in package.json:
- Core dependencies: @aws-lambda-powertools/commons
- Peer dependencies: @standard-schema/spec (optional)
- Dev dependencies: vitest, typescript, biome

### System Requirements
- **OS**: macOS, Linux, or Windows
- **Memory**: 2GB minimum
- **Disk Space**: 500MB for node_modules and build artifacts

---

## Build Steps

### 1. Install Dependencies

From the project root:

```bash
npm install
```

This installs all workspace dependencies including the event-handler package.

### 2. Build the Package

From the event-handler package directory:

```bash
cd packages/event-handler
npm run build
```

Or from the project root:

```bash
npm run build --workspace=@aws-lambda-powertools/event-handler
```

The build script executes:
- `build:esm` - Compiles TypeScript to ESM format in `lib/esm/`
- `build:cjs` - Compiles TypeScript to CommonJS format in `lib/cjs/`

### 3. Verify Build Success

**Expected Output**:
```
> @aws-lambda-powertools/event-handler@2.28.1 build
> npm run build:esm & npm run build:cjs

Successfully compiled TypeScript
```

**Build Artifacts**:
- `lib/esm/` - ESM module output
  - `rest/middleware/validation.js`
  - `rest/middleware/validation.d.ts`
  - `rest/errors.js`
  - `rest/errors.d.ts`
  - `types/rest.js`
  - `types/rest.d.ts`
- `lib/cjs/` - CommonJS output (same structure)

**Verification**:
```bash
# Check that validation middleware was compiled
ls -la lib/esm/rest/middleware/validation.*
ls -la lib/cjs/rest/middleware/validation.*

# Check that error classes were compiled
ls -la lib/esm/rest/errors.*
ls -la lib/cjs/rest/errors.*
```

### 4. Lint the Code

```bash
npm run lint
```

Expected: No linting errors for new validation code.

---

## Troubleshooting

### Build Fails with TypeScript Errors

**Cause**: Type errors in validation middleware code

**Solution**:
1. Review TypeScript errors in console output
2. Check that StandardSchema types are correctly defined
3. Verify all imports are correct
4. Run `npm run build` again after fixes

### Build Fails with Missing Dependencies

**Cause**: Dependencies not installed or corrupted

**Solution**:
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Build Succeeds but Files Missing

**Cause**: TypeScript configuration issue

**Solution**:
1. Check `tsconfig.json` includes validation files
2. Verify `src/rest/middleware/validation.ts` exists
3. Check for `.gitignore` or `.npmignore` excluding files
4. Rebuild: `npm run build`

---

## Build Artifacts Location

All build artifacts are in the `lib/` directory:

```
lib/
├── esm/
│   ├── rest/
│   │   ├── middleware/
│   │   │   ├── validation.js
│   │   │   └── validation.d.ts
│   │   ├── errors.js
│   │   └── errors.d.ts
│   └── types/
│       ├── rest.js
│       └── rest.d.ts
└── cjs/
    └── (same structure as esm)
```

---

## Next Steps

After successful build:
1. Proceed to unit test execution
2. Run integration tests
3. Verify all tests pass
