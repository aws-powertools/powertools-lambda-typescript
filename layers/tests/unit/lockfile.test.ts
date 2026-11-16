import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buildAllowedVersions,
  buildLayerPackageJson,
  buildOverrides,
  collectInstalledPackages,
  collectPinnedPackages,
  findVersionDrift,
  getPinnedVersion,
  type Lockfile,
  resolveLockfilePath,
} from '../../src/lockfile.js';

/**
 * Fixture mirroring the shapes the real lockfile has: a hoisted dependency, the
 * same package nested at another major, a workspace link, a peer dependency,
 * an optional peer, an optional dependency with no entry, and dev-only
 * dependencies that must stay out of the layer.
 */
const lockfile: Lockfile = {
  packages: {
    '': { name: 'root' },
    'packages/logger': {
      name: '@scope/logger',
      version: '1.0.0',
      dependencies: {
        '@scope/commons': '1.0.0',
        hoisted: '^1.0.0',
        nested: '^4.0.0',
      },
      devDependencies: { 'dev-only': '^9.0.0' },
      peerDependencies: {
        'peer-required': '^2.0.0',
        'peer-optional': '^3.0.0',
      },
      peerDependenciesMeta: { 'peer-optional': { optional: true } },
    },
    'packages/commons': {
      name: '@scope/commons',
      version: '1.0.0',
      dependencies: { hoisted: '^1.0.0' },
    },
    'node_modules/@scope/commons': { resolved: 'packages/commons', link: true },
    'node_modules/hoisted': {
      version: '1.5.0',
      dependencies: { nested: '^2.0.0' },
      optionalDependencies: { 'optional-absent': '^1.0.0' },
    },
    'node_modules/hoisted/node_modules/nested': { version: '2.1.0' },
    'node_modules/nested': { version: '4.0.0' },
    'node_modules/peer-required': { version: '2.2.0' },
    'node_modules/peer-optional': { version: '3.3.0' },
    'node_modules/dev-only': { version: '9.9.9', dev: true },
    'node_modules/zod': { version: '4.6.7' },
  },
};

const roots = ['packages/logger', 'packages/commons'];

describe('resolveLockfilePath', () => {
  const packages = lockfile.packages ?? {};

  it('prefers a nested entry over the hoisted one', () => {
    expect(
      resolveLockfilePath(packages, 'node_modules/hoisted', 'nested')
    ).toBe('node_modules/hoisted/node_modules/nested');
  });

  it('walks up to the hoisted entry when there is no nested one', () => {
    expect(
      resolveLockfilePath(
        packages,
        'node_modules/hoisted/node_modules/nested',
        'hoisted'
      )
    ).toBe('node_modules/hoisted');
  });

  it('resolves dependencies of a workspace from the root', () => {
    expect(resolveLockfilePath(packages, 'packages/logger', 'nested')).toBe(
      'node_modules/nested'
    );
  });

  it('returns undefined when there is no entry', () => {
    expect(resolveLockfilePath(packages, 'packages/logger', 'absent')).toBe(
      undefined
    );
  });
});

describe('collectPinnedPackages', () => {
  it('pins the runtime closure of the workspaces, and nothing else', () => {
    // Act
    const pinned = collectPinnedPackages(lockfile, {
      roots,
      extraDependencies: ['zod'],
    });

    // Assess
    expect(pinned).toEqual([
      {
        name: 'hoisted',
        version: '1.5.0',
        path: 'node_modules/hoisted',
        specs: ['^1.0.0'],
      },
      {
        name: 'nested',
        version: '2.1.0',
        path: 'node_modules/hoisted/node_modules/nested',
        specs: ['^2.0.0'],
      },
      {
        name: 'nested',
        version: '4.0.0',
        path: 'node_modules/nested',
        specs: ['^4.0.0'],
      },
      {
        name: 'peer-required',
        version: '2.2.0',
        path: 'node_modules/peer-required',
        specs: ['^2.0.0'],
      },
      { name: 'zod', version: '4.6.7', path: 'node_modules/zod', specs: [] },
    ]);
    // Optional peers (the @aws-sdk/* clients in the real tree), dev
    // dependencies and the linked workspaces are never pinned.
    const names = pinned.map((entry) => entry.name);
    expect(names).not.toContain('peer-optional');
    expect(names).not.toContain('dev-only');
    expect(names).not.toContain('@scope/commons');
  });

  it('throws when a workspace is missing from the lockfile', () => {
    expect(() =>
      collectPinnedPackages(lockfile, { roots: ['packages/absent'] })
    ).toThrow('Workspace packages/absent is not in the lockfile');
  });

  it('throws when an extra dependency is missing from the lockfile', () => {
    expect(() =>
      collectPinnedPackages(lockfile, { roots, extraDependencies: ['absent'] })
    ).toThrow('Dependency absent is not in the lockfile');
  });

  it('throws when a dependency has no entry in the lockfile', () => {
    // Prepare
    const stale: Lockfile = {
      packages: {
        'packages/logger': {
          name: '@scope/logger',
          version: '1.0.0',
          dependencies: { hoisted: '^1.0.0' },
        },
      },
    };

    // Act & Assess
    expect(() =>
      collectPinnedPackages(stale, { roots: ['packages/logger'] })
    ).toThrow('hoisted (required by packages/logger)');
  });
});

describe('getPinnedVersion', () => {
  const pinned = collectPinnedPackages(lockfile, {
    roots,
    extraDependencies: ['zod'],
  });

  it('returns the version of a package pinned once', () => {
    expect(getPinnedVersion(pinned, 'zod')).toBe('4.6.7');
  });

  it('throws when the package is not pinned', () => {
    expect(() => getPinnedVersion(pinned, 'absent')).toThrow(
      'Expected exactly one version of absent in the lockfile, found none'
    );
  });

  it('throws when the package is pinned more than once', () => {
    expect(() => getPinnedVersion(pinned, 'nested')).toThrow(
      'found 2.1.0, 4.0.0'
    );
  });
});

describe('buildOverrides', () => {
  it('pins one version per name, and one per range when there are several', () => {
    // Act
    const overrides = buildOverrides(
      collectPinnedPackages(lockfile, { roots, extraDependencies: ['zod'] }),
      ['@scope/logger', '@scope/commons', 'zod']
    );

    // Assess
    expect(overrides).toEqual({
      hoisted: '1.5.0',
      // A single rule cannot pin both majors, and a rule nested under the
      // package it sits below in the lockfile is hidden by the top-level rules
      // of the packages in between, so the rules are keyed by requested range.
      'nested@^2.0.0': '2.1.0',
      'nested@^4.0.0': '4.0.0',
      'peer-required': '2.2.0',
    });
    // npm rejects an override that changes a direct dependency of the root.
    expect(Object.keys(overrides)).not.toContain('zod');
  });

  it('throws when the same range resolves to two versions', () => {
    expect(() =>
      buildOverrides([
        { name: 'dup', version: '1.0.0', path: 'a', specs: ['^1.0.0'] },
        { name: 'dup', version: '1.2.0', path: 'b', specs: ['^1.0.0'] },
      ])
    ).toThrow('the lockfile resolves dup@^1.0.0 to both 1.0.0 and 1.2.0');
  });

  it('throws when a duplicated package has no known requester', () => {
    expect(() =>
      buildOverrides([
        { name: 'dup', version: '1.0.0', path: 'a', specs: [] },
        { name: 'dup', version: '2.0.0', path: 'b', specs: ['^2.0.0'] },
      ])
    ).toThrow('nothing depends on a');
  });
});

describe('buildLayerPackageJson', () => {
  it('writes the direct dependencies and the pinned overrides', () => {
    // Act
    const manifest = buildLayerPackageJson({
      version: '2.36.0',
      dependencies: { zod: '4.6.7', '@scope/logger': '2.36.0' },
      pinned: collectPinnedPackages(lockfile, {
        roots,
        extraDependencies: ['zod'],
      }),
    });

    // Assess
    expect(manifest).toEqual({
      name: 'aws-lambda-powertools-layer',
      version: '2.36.0',
      private: true,
      dependencies: { '@scope/logger': '2.36.0', zod: '4.6.7' },
      overrides: {
        hoisted: '1.5.0',
        'nested@^2.0.0': '2.1.0',
        'nested@^4.0.0': '4.0.0',
        'peer-required': '2.2.0',
      },
    });
  });
});

describe('collectInstalledPackages', () => {
  let fixtureDir: string;

  const writePackage = (dir: string, name: string, version?: string) => {
    mkdirSync(join(fixtureDir, dir), { recursive: true });
    writeFileSync(
      join(fixtureDir, dir, 'package.json'),
      JSON.stringify({ name, version })
    );
  };

  beforeAll(() => {
    fixtureDir = mkdtempSync(join(tmpdir(), 'layer-lockfile-'));
    writePackage('hoisted', 'hoisted', '1.5.0');
    writePackage('hoisted/node_modules/nested', 'nested', '2.1.0');
    writePackage('@scope/logger', '@scope/logger', '2.36.0');
    // No version: not something we can verify, and not what npm installs.
    writePackage('broken', 'broken');
    // Folders npm puts in node_modules that are not packages.
    mkdirSync(join(fixtureDir, '.bin'), { recursive: true });
    mkdirSync(join(fixtureDir, 'empty'), { recursive: true });
    writeFileSync(join(fixtureDir, '.package-lock.json'), '{}');
  });

  afterAll(() => {
    rmSync(fixtureDir, { recursive: true, force: true });
  });

  it('walks scoped packages and nested node_modules', () => {
    expect(collectInstalledPackages(fixtureDir)).toEqual([
      { name: '@scope/logger', version: '2.36.0', path: '@scope/logger' },
      { name: 'hoisted', version: '1.5.0', path: 'hoisted' },
      {
        name: 'nested',
        version: '2.1.0',
        path: 'hoisted/node_modules/nested',
      },
    ]);
  });

  it('returns nothing for a folder that does not exist', () => {
    expect(collectInstalledPackages(join(fixtureDir, 'absent'))).toEqual([]);
  });
});

describe('findVersionDrift', () => {
  const allowed = buildAllowedVersions(
    collectPinnedPackages(lockfile, { roots, extraDependencies: ['zod'] }),
    { '@scope/logger': '2.36.0' }
  );

  it('accepts a tree that matches the lockfile', () => {
    expect(
      findVersionDrift(
        [
          { name: 'hoisted', version: '1.5.0', path: 'hoisted' },
          { name: 'nested', version: '4.0.0', path: 'nested' },
          // Either locked version is fine wherever npm places it.
          {
            name: 'nested',
            version: '2.1.0',
            path: 'hoisted/node_modules/nested',
          },
          { name: '@scope/logger', version: '2.36.0', path: '@scope/logger' },
        ],
        allowed
      )
    ).toEqual([]);
  });

  it('reports a package installed at another version', () => {
    expect(
      findVersionDrift(
        [{ name: 'hoisted', version: '1.6.0', path: 'hoisted' }],
        allowed
      )
    ).toEqual([
      'hoisted@1.6.0 (node_modules/hoisted) does not match the locked version 1.5.0',
    ]);
  });

  it('reports a package that is not part of the locked tree', () => {
    expect(
      findVersionDrift(
        [{ name: 'surprise', version: '1.0.0', path: 'surprise' }],
        allowed
      )
    ).toEqual([
      'surprise@1.0.0 (node_modules/surprise) is not part of the locked dependency tree',
    ]);
  });

  it('reports a utility installed at another version', () => {
    expect(
      findVersionDrift(
        [{ name: '@scope/logger', version: '2.35.0', path: '@scope/logger' }],
        allowed
      )
    ).toEqual([
      '@scope/logger@2.35.0 (node_modules/@scope/logger) does not match the locked version 2.36.0',
    ]);
  });
});
