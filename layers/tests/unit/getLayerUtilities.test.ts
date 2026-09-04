import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  getLayerUtilities,
  packTarballPrefix,
} from '../../src/layer-publisher-stack.js';

describe('getLayerUtilities', () => {
  let fixtureDir: string;

  const writePackage = (
    dir: string,
    manifest: Record<string, unknown> | string
  ) => {
    const pkgDir = join(fixtureDir, dir);
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(
      join(pkgDir, 'package.json'),
      typeof manifest === 'string' ? manifest : JSON.stringify(manifest)
    );
  };

  beforeAll(() => {
    fixtureDir = mkdtempSync(join(tmpdir(), 'layer-utils-'));

    writePackage('logger', { name: '@aws-lambda-powertools/logger' });
    writePackage('data-masking', {
      name: '@aws-lambda-powertools/data-masking',
    });
    // Private packages (e.g. testing-utils) must be excluded.
    writePackage('testing', {
      name: '@aws-lambda-powertools/testing-utils',
      private: true,
    });
    // Packages outside the Powertools scope must be excluded.
    writePackage('some-tool', { name: 'some-tool' });
    // Unparseable manifests must be skipped, not throw.
    writePackage('broken', '{ not valid json');
    // Loose files that aren't directories must be ignored.
    writeFileSync(join(fixtureDir, 'README.md'), '# not a package');
  });

  afterAll(() => {
    rmSync(fixtureDir, { recursive: true, force: true });
  });

  it('returns only non-private @aws-lambda-powertools packages, sorted', () => {
    // Act
    const utilities = getLayerUtilities(fixtureDir);

    // Assess
    expect(utilities).toEqual([
      {
        workspace: 'data-masking',
        packageName: '@aws-lambda-powertools/data-masking',
      },
      { workspace: 'logger', packageName: '@aws-lambda-powertools/logger' },
    ]);
  });

  it('bundles every publishable utility in the real workspace', () => {
    // Prepare
    const packagesDir = join(import.meta.dirname, '..', '..', '..', 'packages');

    // Act
    const workspaces = getLayerUtilities(packagesDir).map((u) => u.workspace);

    // Assess
    expect(workspaces).toEqual([
      'batch',
      'commons',
      'data-masking',
      'event-handler',
      'idempotency',
      'jmespath',
      'kafka',
      'logger',
      'metrics',
      'parameters',
      'parser',
      'signer',
      'tracer',
      'validation',
    ]);
    // The internal testing package is private and must never ship in the layer.
    expect(workspaces).not.toContain('testing');
  });
});

describe('packTarballPrefix', () => {
  it('derives the npm pack tarball prefix from a scoped package name', () => {
    expect(packTarballPrefix('@aws-lambda-powertools/logger')).toBe(
      'aws-lambda-powertools-logger-'
    );
    expect(packTarballPrefix('@aws-lambda-powertools/data-masking')).toBe(
      'aws-lambda-powertools-data-masking-'
    );
  });
});
