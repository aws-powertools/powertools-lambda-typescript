import { type Dirent, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { intersects, validRange } from 'semver';

/**
 * Minimal view of an entry of the `packages` map of a v3 `package-lock.json`,
 * limited to the fields needed to walk the dependency graph.
 */
export interface LockfileEntry {
  readonly name?: string;
  readonly version?: string;
  /** Target path of a workspace symlink, set together with `link`. */
  readonly resolved?: string;
  readonly link?: boolean;
  /** Set on entries only reachable through dev dependencies. */
  readonly dev?: boolean;
  readonly dependencies?: Record<string, string>;
  /** Present on workspace entries, and deliberately not walked. */
  readonly devDependencies?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

export interface Lockfile {
  readonly packages?: Record<string, LockfileEntry>;
}

export interface PinnedPackage {
  readonly name: string;
  readonly version: string;
  /** Lockfile key the version was read from, used in error messages. */
  readonly path: string;
  /** Distinct ranges the packages depending on it ask for, sorted. */
  readonly specs: readonly string[];
}

export interface InstalledPackage {
  readonly name: string;
  readonly version: string;
  /** Path of the package folder, relative to the walked `node_modules`. */
  readonly path: string;
}

export interface LayerPackageJson {
  readonly name: string;
  readonly version: string;
  readonly private: true;
  readonly dependencies: Record<string, string>;
  readonly overrides: Record<string, string>;
}

/**
 * Splits a lockfile key into the `node_modules` owners enclosing it and the
 * name of the package itself. A key with no `node_modules` segment is a
 * workspace rather than an installed package, and has no name of its own here.
 */
const splitLockfilePath = (path: string): string | undefined => {
  // The leading slash makes the first `node_modules` segment match too.
  const segments = `/${path}`.split('/node_modules/');
  return segments.length > 1 ? segments[segments.length - 1] : undefined;
};

/**
 * Resolves the lockfile key that a dependency of `fromPath` points at, using
 * Node.js resolution rules: the closest `node_modules` wins, so a nested
 * `node_modules/<owner>/node_modules/<dep>` entry takes precedence over the
 * hoisted `node_modules/<dep>` one.
 */
export const resolveLockfilePath = (
  packages: Record<string, LockfileEntry>,
  fromPath: string,
  name: string
): string | undefined => {
  let base = fromPath;
  for (;;) {
    const candidate =
      base === '' ? `node_modules/${name}` : `${base}/node_modules/${name}`;
    if (packages[candidate] !== undefined) {
      return candidate;
    }
    if (base === '') {
      return undefined;
    }
    const index = base.lastIndexOf('/node_modules/');
    base = index === -1 ? '' : base.slice(0, index);
  }
};

/**
 * The dependency edges npm installs for a package:
 *
 * - `dependencies`, always.
 * - `optionalDependencies`, when the platform allows it.
 * - `peerDependencies`, which npm 7+ installs automatically unless they are
 *   flagged optional in `peerDependenciesMeta`.
 *
 * This is also what keeps every `@aws-sdk/*` client out of the layer: the
 * utilities declare them as optional peers, so npm never installs them.
 */
const getDependencyEdges = (
  entry: LockfileEntry
): Array<{ name: string; spec: string; optional: boolean }> => {
  const edges = new Map<string, { spec: string; optional: boolean }>();
  for (const [name, spec] of Object.entries(entry.dependencies ?? {})) {
    edges.set(name, { spec, optional: false });
  }
  for (const [name, spec] of Object.entries(entry.optionalDependencies ?? {})) {
    if (!edges.has(name)) {
      edges.set(name, { spec, optional: true });
    }
  }
  for (const [name, spec] of Object.entries(entry.peerDependencies ?? {})) {
    if (entry.peerDependenciesMeta?.[name]?.optional === true) {
      continue;
    }
    if (!edges.has(name)) {
      edges.set(name, { spec, optional: false });
    }
  }
  return [...edges].map(([name, edge]) => ({ name, ...edge }));
};

export interface CollectPinnedPackagesOptions {
  /**
   * Lockfile keys of the workspaces that ship in the layer, e.g.
   * `packages/logger`. They are walked but never pinned themselves, since they
   * are installed as direct dependencies at the release version.
   */
  readonly roots: readonly string[];
  /**
   * Extra direct dependencies of the layer, resolved from the root
   * `node_modules`, e.g. `zod`.
   */
  readonly extraDependencies?: readonly string[];
}

/**
 * Walks the lockfile from the layer's workspaces and returns the exact version
 * of every third-party package the layer install pulls in, together with the
 * ranges its consumers ask for.
 *
 * Workspace links (e.g. `@aws-lambda-powertools/commons` as a dependency of
 * `@aws-lambda-powertools/idempotency`) are followed so their own dependencies
 * are collected, but the utilities themselves are not pinned: they are
 * installed as direct dependencies at the release version.
 */
export const collectPinnedPackages = (
  lockfile: Lockfile,
  options: CollectPinnedPackagesOptions
): PinnedPackage[] => {
  const packages = lockfile.packages ?? {};
  const roots = new Set<string>(options.roots);
  const versions = new Map<string, { name: string; version: string }>();
  const specs = new Map<string, Set<string>>();
  const visited = new Set<string>();
  const unresolved: string[] = [];

  const visit = (path: string, from: string): void => {
    if (visited.has(path)) {
      return;
    }
    visited.add(path);

    const entry = packages[path];
    if (entry === undefined) {
      unresolved.push(`${path} (required by ${from || 'the layer'})`);
      return;
    }

    // Workspace symlinks point at the real entry, which holds the dependencies.
    let target = path;
    let manifest = entry;
    if (entry.link === true) {
      target = entry.resolved ?? '';
      manifest = packages[target] ?? {};
      if (manifest.version === undefined) {
        unresolved.push(`${path} -> ${target} (required by ${from})`);
        return;
      }
    }

    const name = splitLockfilePath(path);
    if (name !== undefined && !roots.has(path) && !roots.has(target)) {
      if (manifest.version === undefined) {
        unresolved.push(`${path} (no version in the lockfile)`);
        return;
      }
      versions.set(path, { name, version: manifest.version });
    }

    for (const edge of getDependencyEdges(manifest)) {
      // Dependencies of a linked workspace resolve from the workspace folder.
      const edgePath = resolveLockfilePath(packages, target, edge.name);
      if (edgePath === undefined) {
        // Optional dependencies may legitimately be absent, e.g. when they only
        // apply to another platform.
        if (!edge.optional) {
          unresolved.push(`${edge.name} (required by ${target})`);
        }
        continue;
      }
      const edgeSpecs = specs.get(edgePath);
      if (edgeSpecs === undefined) {
        specs.set(edgePath, new Set([edge.spec]));
      } else {
        edgeSpecs.add(edge.spec);
      }
      visit(edgePath, target);
    }
  };

  for (const root of options.roots) {
    if (packages[root] === undefined) {
      throw new Error(`Workspace ${root} is not in the lockfile`);
    }
    visit(root, '');
  }
  for (const name of options.extraDependencies ?? []) {
    const path = resolveLockfilePath(packages, '', name);
    if (path === undefined) {
      throw new Error(`Dependency ${name} is not in the lockfile`);
    }
    visit(path, '');
  }

  if (unresolved.length > 0) {
    throw new Error(
      `Could not resolve these dependencies in the lockfile, it may be out of date:\n  - ${unresolved.join(
        '\n  - '
      )}`
    );
  }

  return [...versions]
    .map(([path, { name, version }]) => ({
      name,
      version,
      path,
      specs: [...(specs.get(path) ?? [])].sort(),
    }))
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) || a.version.localeCompare(b.version)
    );
};

/**
 * Returns the single pinned version of a package, throwing when it is absent or
 * pinned at more than one version.
 */
export const getPinnedVersion = (
  pinned: readonly PinnedPackage[],
  name: string
): string => {
  const versions = new Set(
    pinned.filter((entry) => entry.name === name).map((entry) => entry.version)
  );
  if (versions.size !== 1) {
    throw new Error(
      `Expected exactly one version of ${name} in the lockfile, found ${
        versions.size === 0 ? 'none' : [...versions].join(', ')
      }`
    );
  }
  return [...versions][0] as string;
};

const groupByName = (
  pinned: readonly PinnedPackage[]
): Map<string, PinnedPackage[]> => {
  const byName = new Map<string, PinnedPackage[]>();
  for (const entry of pinned) {
    const entries = byName.get(entry.name);
    if (entries === undefined) {
      byName.set(entry.name, [entry]);
    } else {
      entries.push(entry);
    }
  }
  return byName;
};

/**
 * Throws when two ranges a package is requested with pin it to different
 * versions but overlap.
 *
 * npm applies a `"<name>@<range>"` override to every dependency edge whose
 * requested range intersects `<range>`, so with `"semver@^5.0.0": "5.7.1"` and
 * `"semver@^5.7.0": "5.7.2"` both edges get 5.7.1. The post-install check can't
 * catch that, since 5.7.1 is a locked version of `semver`, so the build fails
 * here instead.
 */
const assertRangesDoNotOverlap = (
  name: string,
  entries: readonly PinnedPackage[]
): void => {
  const rules = entries.flatMap((entry) =>
    entry.specs.map((spec) => ({ spec, version: entry.version }))
  );
  for (const { spec } of rules) {
    if (validRange(spec) === null) {
      throw new Error(
        `Cannot pin ${name}: the lockfile has it at several versions and ${name}@${spec} is not a semver range`
      );
    }
  }
  for (const [index, rule] of rules.entries()) {
    for (const other of rules.slice(index + 1)) {
      if (rule.version !== other.version && intersects(rule.spec, other.spec)) {
        throw new Error(
          `Cannot pin ${name}: ${name}@${rule.spec} (${rule.version}) and ${name}@${other.spec} (${other.version}) overlap, so npm would apply one override to both`
        );
      }
    }
  }
};

/**
 * Builds the npm `overrides` that pin every transitive dependency to its
 * lockfile version.
 *
 * Packages present at a single version get a plain `"<name>": "<version>"` rule.
 * Packages present at several versions (today `@smithy/types`, 4.x hoisted and
 * 2.x under `aws-xray-sdk-core`, and `semver`) get one rule per range their
 * consumers ask for, e.g. `"@smithy/types@^2.12.0"`, so npm can pick a
 * different version per dependency edge.
 *
 * Nesting the rule under the package it is nested below in the lockfile, as in
 * `"aws-xray-sdk-core": { "@smithy/types": "2.12.0" }`, does not work here: npm
 * applies the rule it finds on the closest matching ancestor rule, and every
 * package in between carries a top-level rule of its own, which replaces the
 * ancestor and hides the nested one. Spelling out the whole dependency chain
 * would work, but keying rules by the requested range does not depend on where
 * npm happens to place a package.
 *
 * Names in `directDependencies` are skipped: npm rejects an override that
 * changes a direct dependency of the root package.
 */
export const buildOverrides = (
  pinned: readonly PinnedPackage[],
  directDependencies: readonly string[] = []
): Record<string, string> => {
  const direct = new Set(directDependencies);
  const overrides: Record<string, string> = {};

  for (const [name, entries] of groupByName(pinned)) {
    if (direct.has(name)) {
      continue;
    }
    if (new Set(entries.map((entry) => entry.version)).size === 1) {
      overrides[name] = entries[0]?.version as string;
      continue;
    }
    for (const entry of entries) {
      if (entry.specs.length === 0) {
        throw new Error(
          `Cannot pin ${name}: the lockfile has it at ${entries
            .map((other) => other.version)
            .join(', ')} and nothing depends on ${entry.path}`
        );
      }
      for (const spec of entry.specs) {
        const pinnedVersion = overrides[`${name}@${spec}`];
        if (pinnedVersion !== undefined && pinnedVersion !== entry.version) {
          throw new Error(
            `Cannot pin ${name}: the lockfile resolves ${name}@${spec} to both ${pinnedVersion} and ${entry.version}`
          );
        }
        overrides[`${name}@${spec}`] = entry.version;
      }
    }
    assertRangesDoNotOverlap(name, entries);
  }

  return Object.fromEntries(
    Object.entries(overrides).sort(([a], [b]) => a.localeCompare(b))
  );
};

export interface BuildLayerPackageJsonOptions {
  readonly version: string;
  /** Direct dependencies of the layer: the utilities, and `zod`. */
  readonly dependencies: Record<string, string>;
  readonly pinned: readonly PinnedPackage[];
}

/**
 * Builds the temporary `package.json` the layer is installed from, so the
 * dependency tree that ships in the layer is the one the lockfile describes.
 */
export const buildLayerPackageJson = ({
  version,
  dependencies,
  pinned,
}: BuildLayerPackageJsonOptions): LayerPackageJson => ({
  name: 'aws-lambda-powertools-layer',
  version,
  private: true,
  dependencies: Object.fromEntries(
    Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b))
  ),
  overrides: buildOverrides(pinned, Object.keys(dependencies)),
});

/**
 * Builds the name to versions map the installed tree is verified against: every
 * pinned package, plus `extraVersions` for the packages installed at a version
 * that does not come from the lockfile, i.e. the utilities at the release
 * version.
 */
export const buildAllowedVersions = (
  pinned: readonly PinnedPackage[],
  extraVersions: Record<string, string> = {}
): Map<string, Set<string>> => {
  const allowed = new Map<string, Set<string>>();
  for (const entry of pinned) {
    const versions = allowed.get(entry.name);
    if (versions === undefined) {
      allowed.set(entry.name, new Set([entry.version]));
    } else {
      versions.add(entry.version);
    }
  }
  for (const [name, version] of Object.entries(extraVersions)) {
    allowed.set(name, new Set([version]));
  }
  return allowed;
};

/**
 * Walks an installed `node_modules` folder, including scoped packages and
 * nested `node_modules`, and returns every package found in it.
 */
export const collectInstalledPackages = (
  nodeModulesDir: string
): InstalledPackage[] => {
  const installed: InstalledPackage[] = [];

  const walk = (dir: string, prefix: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      // `.bin`, `.package-lock.json` and friends are not packages.
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue;
      }
      const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      if (entry.name.startsWith('@')) {
        walk(join(dir, entry.name), path);
        continue;
      }
      const packageDir = join(dir, entry.name);
      let manifest: { name?: string; version?: string } = {};
      try {
        manifest = JSON.parse(
          readFileSync(join(packageDir, 'package.json'), 'utf-8')
        );
      } catch {
        // Not a package, e.g. a stray folder: nothing to verify.
      }
      if (
        typeof manifest.name === 'string' &&
        typeof manifest.version === 'string'
      ) {
        installed.push({
          name: manifest.name,
          version: manifest.version,
          path,
        });
      }
      walk(join(packageDir, 'node_modules'), `${path}/node_modules`);
    }
  };

  walk(nodeModulesDir, '');

  return installed.sort((a, b) => a.path.localeCompare(b.path));
};

/**
 * Compares an installed tree against the versions derived from the lockfile and
 * returns one message per package that is unexpected or at the wrong version.
 */
export const findVersionDrift = (
  installed: readonly InstalledPackage[],
  allowed: Map<string, Set<string>>
): string[] =>
  installed.flatMap((entry) => {
    const versions = allowed.get(entry.name);
    if (versions === undefined) {
      return [
        `${entry.name}@${entry.version} (node_modules/${entry.path}) is not part of the locked dependency tree`,
      ];
    }
    if (!versions.has(entry.version)) {
      return [
        `${entry.name}@${entry.version} (node_modules/${entry.path}) does not match the locked version ${[
          ...versions,
        ].join(', ')}`,
      ];
    }
    return [];
  });
