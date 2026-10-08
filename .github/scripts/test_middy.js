import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { middySuites, middyVersions } from '../../vitest.middy.config.js';

// Middy v8 requires Node.js 24, independently of Powertools' runtime support.
if (Number(process.versions.node.split('.')[0]) < 24) {
  throw new Error(
    'The Middy prerelease compatibility matrix requires Node.js 24'
  );
}

const root = fileURLToPath(new URL('../../', import.meta.url));
const testFiles = Object.entries(middySuites).flatMap(([workspace, suites]) =>
  suites.map((suite) =>
    resolve(root, `packages/${workspace}/tests/unit/${suite}.test.ts`)
  )
);
testFiles.push(resolve(root, 'packages/parser/tests/types/parser.test-d.ts'));

// Check each version's real declarations rather than a union or a cast of the
// middleware factory. Resolve the same imports as the runtime matrix does.
for (const version of middyVersions) {
  console.log(`Type checking Middy compatibility: ${version}`);
  const declarations = resolve(
    dirname(fileURLToPath(import.meta.resolve(version))),
    'index.d.ts'
  );
  const config = ts.getParsedCommandLineOfConfigFile(
    resolve(root, 'tsconfig.test.json'),
    {
      incremental: false,
      paths: {
        '@middy/core': [declarations],
        middy5: [declarations],
      },
    },
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        );
      },
    }
  );
  const program = ts.createProgram({
    rootNames: [
      ...testFiles,
      resolve(root, 'packages/testing/src/setupEnv.ts'),
    ],
    options: config.options,
  });
  const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(program)];
  if (diagnostics.length > 0) {
    console.error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCurrentDirectory: () => root,
        getCanonicalFileName: (fileName) => fileName,
        getNewLine: () => '\n',
      })
    );
    process.exit(1);
  }
}

const result = spawnSync(
  process.execPath,
  [
    resolve(root, 'node_modules/vitest/vitest.mjs'),
    '--run',
    '--config',
    'vitest.middy.config.js',
  ],
  { cwd: root, stdio: 'inherit' }
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
