/**
 * Lists the workspaces a CI matrix should cover, derived from the root
 * `package.json` and each workspace's own files, so that adding a package to
 * the root `workspaces` array is all it takes to get it into CI.
 *
 * Usage: node list_workspaces.mjs <unit|e2e|e2e-lmi>
 *
 *   unit     every non-private workspace under `packages/`; the other workspaces
 *            (layers, examples, testing utils) have dedicated jobs
 *   e2e      every workspace with `tests/e2e/*.test.ts` files other than LMI ones
 *   e2e-lmi  every workspace with `tests/e2e/lmi*.test.ts` files
 *
 * A workspace with e2e suites must also define the script the matrix job runs
 * (`test:e2e`, or `test:e2e:lmi` for LMI suites), otherwise this fails loudly
 * instead of letting the job fail on a missing script.
 *
 * Prints a sorted JSON array of workspace paths, ready for `fromJSON()` in a
 * matrix definition.
 *
 * Written as ESM on purpose, hence the `.mjs` extension next to the CommonJS
 * scripts in this directory.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = join(import.meta.dirname, '..', '..');

const readManifest = (workspace) =>
  JSON.parse(readFileSync(join(rootDir, workspace, 'package.json'), 'utf-8'));

const e2eTestFiles = (workspace) => {
  const dir = join(rootDir, workspace, 'tests', 'e2e');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => file.endsWith('.test.ts'));
};

/** LMI suites run in their own job, see `test:e2e:lmi` in the package scripts. */
const isLmiTest = (file) => file.startsWith('lmi.');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const hasE2eSuites = (workspace, matches, script) => {
  const hasSuites = e2eTestFiles(workspace).some(matches);
  if (hasSuites && readManifest(workspace).scripts?.[script] === undefined) {
    fail(`${workspace} has e2e suites but no "${script}" script to run them`);
  }
  return hasSuites;
};

const selectors = {
  unit: (workspace) =>
    workspace.startsWith('packages/') &&
    readManifest(workspace).private !== true,
  e2e: (workspace) =>
    hasE2eSuites(workspace, (file) => !isLmiTest(file), 'test:e2e'),
  'e2e-lmi': (workspace) => hasE2eSuites(workspace, isLmiTest, 'test:e2e:lmi'),
};

const [mode] = process.argv.slice(2);
const select = selectors[mode];
if (select === undefined) {
  console.error(
    `Usage: node list_workspaces.mjs <${Object.keys(selectors).join('|')}>`
  );
  process.exit(1);
}

const { workspaces } = readManifest('.');
const selected = [];
for (const workspace of workspaces) {
  if (workspace.includes('*')) {
    console.error(
      `Workspace pattern "${workspace}" is a glob; list every workspace explicitly in the root package.json`
    );
    process.exit(1);
  }
  if (select(workspace)) selected.push(workspace);
}

if (selected.length === 0) {
  console.error(`No workspaces matched mode "${mode}"`);
  process.exit(1);
}

console.log(JSON.stringify(selected.toSorted()));
