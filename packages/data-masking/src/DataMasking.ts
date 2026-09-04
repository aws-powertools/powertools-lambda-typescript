import {
  isNullOrUndefined,
  isString,
} from '@aws-lambda-powertools/commons/typeutils';
import { DEFAULT_MASK_VALUE } from './constants.js';
import {
  DataMaskingEncryptionError,
  DataMaskingFieldNotFoundError,
  DataMaskingUnsupportedTypeError,
} from './errors.js';
import type {
  DataMaskingConstructorOptions,
  DecryptOptions,
  EncryptionProvider,
  EncryptOptions,
  EraseOptions,
  MaskedPayload,
  MaskingRule,
} from './types.js';

/**
 * Orchestrates erasing, encrypting, and decrypting sensitive data.
 *
 * @example
 * ```typescript
 * import { DataMasking } from '@aws-lambda-powertools/data-masking';
 *
 * const masker = new DataMasking();
 * const masked = masker.erase(data, { fields: ['customer.ssn'] });
 * ```
 */
export class DataMasking {
  /** Encryption provider used by `encrypt()` and `decrypt()`; not required for `erase()`. */
  readonly #provider?: EncryptionProvider;
  /** Whether to throw when a field path expression matches nothing in the data. */
  readonly #throwOnMissingField: boolean;

  public constructor(options?: DataMaskingConstructorOptions) {
    this.#provider = options?.provider;
    this.#throwOnMissingField = options?.throwOnMissingField ?? true;
  }

  /**
   * Irreversibly masks the entire payload with the default mask value:
   * arrays element-wise preserving their length, and everything else
   * with a single mask string.
   *
   * @param data - The data to mask; returned as-is when `null` or `undefined`
   */
  erase<T>(data: T): MaskedPayload<T>;
  /**
   * Irreversibly masks fields in a data object and returns a deep copy.
   *
   * The options compose three layers (see {@link EraseOptions | `EraseOptions`}):
   * - a top-level {@link MaskingRule | `MaskingRule`} (`regexPattern` + `maskFormat`, `dynamicMask`,
   *   or `customMask`) sets the default masking strategy;
   * - `fields` selects the paths to mask with that strategy — when omitted, a
   *   top-level rule is applied to every leaf value in the payload;
   * - `maskingRules` provides per-field rules that take precedence over the
   *   top-level rule for the paths they name.
   *
   * @example
   * ```typescript
   * // mask two fields with the same strategy, overriding one of them
   * const masked = masker.erase(data, {
   *   fields: ['ssn', 'card'],
   *   dynamicMask: true,
   *   maskingRules: { card: { customMask: 'XXXX' } },
   * });
   * ```
   *
   * @param data - The data to mask; returned as-is when `null` or `undefined`
   * @param options - Options for the operation, see {@link EraseOptions | `EraseOptions`}
   */
  erase<T>(data: T, options: EraseOptions): T;
  erase(data: unknown, options?: EraseOptions): unknown {
    if (isNullOrUndefined(data)) return data;

    const { fields, maskingRules, ...topLevelRule } = options ?? {};
    const hasTopLevelRule = isMaskingRule(topLevelRule);

    if (!fields && !maskingRules) {
      // A top-level rule with no fields applies to every leaf in the payload.
      if (hasTopLevelRule) {
        if (typeof data !== 'object' || data === null) {
          return maskLeaf(data, topLevelRule);
        }
        const copy = this.#deepCopy(data);
        applyRuleToLeaves(copy, topLevelRule);

        return copy;
      }
      // No options at all: collapse the whole payload to the mask value.
      return Array.isArray(data)
        ? data.map(() => DEFAULT_MASK_VALUE)
        : DEFAULT_MASK_VALUE;
    }

    const copy = this.#deepCopy(data);

    // Resolve every path against the untouched copy before masking anything. Rules
    // are claimed first so they win over the top-level rule for the paths they name.
    const targets = new Map<string, MaskTarget>();
    for (const [field, rule] of Object.entries(maskingRules ?? {})) {
      for (const path of this.#resolvePaths(copy, field)) {
        claim(targets, path, rule);
      }
    }
    for (const field of fields ?? []) {
      for (const path of this.#resolvePaths(copy, field)) {
        claim(targets, path, hasTopLevelRule ? topLevelRule : undefined);
      }
    }

    for (const { path, rule } of withoutSubsumed(targets)) {
      // A plain field erase replaces any value with the mask; a rule stringifies
      // the leaf first (null/undefined pass through), matching the Python utility.
      setAtPath(
        copy,
        path,
        rule ? maskLeaf(getAtPath(copy, path), rule) : DEFAULT_MASK_VALUE
      );
    }

    return copy;
  }

  /**
   * Encrypts data using the configured provider.
   *
   * With `fields`, encrypts the matched values in place and returns a deep copy;
   * without `fields`, encrypts the entire payload into a single string.
   *
   * @example
   * ```typescript
   * const encrypted = await masker.encrypt(data, {
   *   fields: ['customer.ssn'],
   *   context: { tenantId: 'acme' },
   * });
   * ```
   *
   * @param data - The data to encrypt
   * @param options - Options for the operation, see {@link EncryptOptions | `EncryptOptions`}
   */
  async encrypt<T>(data: T, options?: EncryptOptions): Promise<T | string> {
    const provider = this.#requireProvider();

    if (!options?.fields) {
      const encryptedPayload = await provider.encrypt(
        JSON.stringify(data),
        options?.context
      );

      return encryptedPayload;
    }

    const copy = this.#deepCopy(data);
    await this.#transformFields(copy, options.fields, async (value) => {
      // Nothing to protect; matches how a masking rule passes `undefined` through.
      if (value === undefined) return value;

      return provider.encrypt(JSON.stringify(value), options.context);
    });

    return copy;
  }

  /**
   * Decrypts data using the configured provider.
   *
   * A string input is treated as a full encrypted payload; an object input is
   * deep copied and the values at `fields` are decrypted in place.
   *
   * @example
   * ```typescript
   * const decrypted = await masker.decrypt(encrypted, {
   *   fields: ['customer.ssn'],
   * });
   * ```
   *
   * @param data - The encrypted payload string or an object holding encrypted fields
   * @param options - Options for the operation, see {@link DecryptOptions | `DecryptOptions`}
   */
  async decrypt<T>(data: T | string, options?: DecryptOptions): Promise<T> {
    const provider = this.#requireProvider();

    if (typeof data === 'string') {
      // Safe by contract: a string payload is the output of `encrypt` without `fields`.
      return JSON.parse(await provider.decrypt(data, options?.context)) as T;
    }

    const copy = this.#deepCopy(data);
    if (options?.fields) {
      await this.#transformFields(copy, options.fields, async (value) => {
        if (value === undefined) return value;
        if (!isString(value)) {
          console.warn(
            `Skipping decryption of non-string value of type ${typeof value}; expected an encrypted string`
          );

          return value;
        }

        return JSON.parse(await provider.decrypt(value, options.context));
      });
    }

    return copy;
  }

  /**
   * Returns the configured encryption provider or throws when none was given.
   */
  #requireProvider(): EncryptionProvider {
    if (!this.#provider) {
      throw new DataMaskingEncryptionError(
        'Encryption provider is required for encrypt/decrypt operations'
      );
    }

    return this.#provider;
  }

  /**
   * Returns a structured clone of `data`, wrapping cloning failures in a package error.
   *
   * @param data - The data to clone
   */
  #deepCopy<T>(data: T): T {
    try {
      return structuredClone(data);
    } catch {
      throw new DataMaskingUnsupportedTypeError(
        'Data contains unsupported types for cloning'
      );
    }
  }

  /**
   * Replaces the value at every path matched by `fields` with the result of `transform`,
   * mutating `data` in place.
   *
   * All paths are resolved before the first `transform` call, so a missing field
   * cannot leave earlier provider calls in flight without a rejection handler.
   *
   * @param data - The object to transform in place
   * @param fields - Path expressions selecting the values to transform
   * @param transform - Async function producing the replacement for a value
   */
  async #transformFields(
    data: unknown,
    fields: string[],
    transform: (value: unknown) => Promise<unknown>
  ): Promise<void> {
    const targets = new Map<string, MaskTarget>();
    for (const field of fields) {
      for (const path of this.#resolvePaths(data, field)) {
        claim(targets, path);
      }
    }

    const transformAt = async (path: string[]): Promise<void> => {
      const result = await transform(getAtPath(data, path));
      setAtPath(data, path, result);
    };
    const operations: Promise<void>[] = [];
    for (const { path } of withoutSubsumed(targets)) {
      operations.push(transformAt(path));
    }

    await Promise.all(operations);
  }

  /**
   * Expands a path expression into every concrete path it matches in `data`,
   * throwing or warning per `throwOnMissingField` when it matches nothing.
   *
   * A wildcard over an empty collection is a match with no paths, not a missing
   * field; only an absent non-wildcard segment counts as missing. Reserved keys
   * (`__proto__`, `constructor`, `prototype`) never resolve, whether named directly
   * or reached through a wildcard, which keeps the in-place assignment free of
   * prototype pollution.
   *
   * @param data - The object to resolve the expression against
   * @param expression - Dot-notation path, optionally with `.*` or `[*]` wildcards
   */
  #resolvePaths(data: unknown, expression: string): string[][] {
    const segments = expression.split(/\.|\[(\*)\]\.?/).filter(Boolean);
    const paths: string[][] = [];
    let missing = false;

    const walk = (node: unknown, depth: number, current: string[]): void => {
      if (depth === segments.length) {
        paths.push(current);

        return;
      }
      if (node == null || typeof node !== 'object') {
        missing = true;

        return;
      }
      const entries = childEntries(node, segments[depth]);
      if (entries.length === 0 && segments[depth] !== '*') missing = true;
      for (const [key, child] of entries) {
        walk(child, depth + 1, [...current, key]);
      }
    };
    if (segments.length === 0) {
      missing = true;
    } else {
      walk(data, 0, []);
    }

    if (paths.length === 0 && missing) {
      if (this.#throwOnMissingField) {
        throw new DataMaskingFieldNotFoundError(
          `Field not found: '${expression}'`
        );
      }
      console.warn(`Field not found: '${expression}'`);
    }

    return paths;
  }
}

/** Keys that never resolve as path segments, so masking cannot touch an object's prototype. */
const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** A resolved concrete path and the rule to mask it with; no rule means the default mask. */
type MaskTarget = { path: string[]; rule?: MaskingRule };

/**
 * Records `path` as a target unless an earlier expression already claimed it.
 *
 * @param targets - Targets collected so far, keyed by {@link pathKey | `pathKey`}
 * @param path - The concrete path to claim
 * @param rule - The rule to mask the path with; omit for the default mask
 */
const claim = (
  targets: Map<string, MaskTarget>,
  path: string[],
  rule?: MaskingRule
): void => {
  const key = pathKey(path);
  if (!targets.has(key)) targets.set(key, { path, rule });
};

/**
 * Drops targets that sit beneath another target.
 *
 * Masking or encrypting a parent already covers everything under it, and applying
 * a child first would hand the parent's rule already-transformed children.
 *
 * @param targets - Targets collected by {@link claim | `claim`}
 */
const withoutSubsumed = (targets: Map<string, MaskTarget>): MaskTarget[] => {
  const kept: MaskTarget[] = [];
  for (const target of targets.values()) {
    if (!hasTargetedAncestor(targets, target.path)) kept.push(target);
  }

  return kept;
};

/**
 * Returns whether any proper prefix of `path` is itself a target.
 *
 * @param targets - Targets collected by {@link claim | `claim`}
 * @param path - The concrete path to check
 */
const hasTargetedAncestor = (
  targets: Map<string, MaskTarget>,
  path: string[]
): boolean => {
  for (let depth = 1; depth < path.length; depth++) {
    if (targets.has(pathKey(path.slice(0, depth)))) return true;
  }

  return false;
};

/**
 * Reads the property `key` of `node`.
 *
 * @param node - A plain object or array reached by walking a resolved path
 * @param key - Own property name or array index
 */
const propertyOf = (node: unknown, key: string): unknown =>
  // Safe: `key` always comes from `childEntries` on this same `node`, so it is an own,
  // non-reserved property and `node` is a container the path already walked through.
  (node as Record<string, unknown>)[key];

/**
 * Returns whether `key` names an own, non-reserved entry of `node`.
 *
 * A present key with an `undefined` value counts; on arrays only index keys do, so
 * `length` never resolves.
 *
 * @param node - The object or array to inspect
 * @param key - The candidate property name
 */
const hasOwnEntry = (node: object, key: string): boolean =>
  !RESERVED_KEYS.has(key) &&
  Object.hasOwn(node, key) &&
  (!Array.isArray(node) || /^\d+$/.test(key));

/**
 * Lists the `[key, value]` entries of `node` selected by one path segment.
 *
 * A literal segment yields at most one entry; the `*` wildcard yields every array
 * index or every own, non-reserved object key.
 *
 * @param node - The object or array to read from
 * @param segment - A property name, array index, or `*`
 */
const childEntries = (node: object, segment: string): [string, unknown][] => {
  if (segment !== '*') {
    return hasOwnEntry(node, segment)
      ? [[segment, propertyOf(node, segment)]]
      : [];
  }

  const entries: [string, unknown][] = [];
  if (Array.isArray(node)) {
    for (const [index, value] of node.entries()) {
      entries.push([String(index), value]);
    }

    return entries;
  }
  for (const key of Object.keys(node)) {
    if (!RESERVED_KEYS.has(key)) entries.push([key, propertyOf(node, key)]);
  }

  return entries;
};

/**
 * Reads the value at `path`.
 *
 * @param data - The object the path was resolved against
 * @param path - A concrete path produced by `#resolvePaths`
 */
const getAtPath = (data: unknown, path: string[]): unknown => {
  let current = data;
  for (const key of path) {
    current = propertyOf(current, key);
  }

  return current;
};

/**
 * Sets `value` at the location identified by `path`, mutating `data` in place.
 *
 * Walks every path segment except the last to reach the parent container, then
 * assigns the value to the final segment. Assumes the path was produced by
 * `#resolvePaths` against the same object, so it is non-empty, free of
 * reserved keys, and its intermediate containers exist.
 *
 * @param data - The object the path was resolved against
 * @param path - A concrete path produced by `#resolvePaths`
 * @param value - The replacement value
 */
const setAtPath = (data: unknown, path: string[], value: unknown): void => {
  let parent = data;
  for (const key of path.slice(0, -1)) {
    parent = propertyOf(parent, key);
  }
  // Safe: `parent` is an intermediate container that `#resolvePaths` walked through.
  (parent as Record<string, unknown>)[path[path.length - 1]] = value;
};

/**
 * Applies a single masking rule to a string value.
 *
 * The strategies are mutually exclusive by construction (see {@link MaskingRule | `MaskingRule`}),
 * so each branch checks for the one property that identifies its variant.
 *
 * @param value - The string to mask
 * @param rule - The rule to apply
 */
const applyMaskingRule = (value: string, rule: MaskingRule): string => {
  if (rule.regexPattern)
    return value.replace(rule.regexPattern, rule.maskFormat);
  // Checked against `undefined` so an intentional empty-string mask is honoured.
  if (rule.customMask !== undefined) return rule.customMask;
  if (rule.dynamicMask) return '*'.repeat(value.length);

  return DEFAULT_MASK_VALUE;
};

/**
 * Returns whether a top-level rule object actually configures a masking strategy.
 *
 * @param rule - The remaining top-level options after `fields` and `maskingRules` are removed
 */
const isMaskingRule = (rule: MaskingRule): boolean =>
  rule.regexPattern !== undefined ||
  rule.customMask !== undefined ||
  rule.dynamicMask !== undefined;

/**
 * Masks a single leaf value with a rule.
 *
 * Leaves are stringified first so the rule applies uniformly to non-string
 * primitives (e.g. `dynamicMask` over a number), matching erase's contract that
 * masked values become strings. `null`/`undefined` pass through unchanged.
 *
 * @param value - The leaf value to mask
 * @param rule - The rule to apply
 */
const maskLeaf = (value: unknown, rule: MaskingRule): unknown =>
  isNullOrUndefined(value) ? value : applyMaskingRule(String(value), rule);

/**
 * Recursively applies a rule to every leaf value, mutating `node` in place.
 *
 * @param node - The object or array to walk
 * @param rule - The rule to apply to each leaf
 */
const applyRuleToLeaves = (node: object, rule: MaskingRule): void => {
  for (const [key, child] of childEntries(node, '*')) {
    if (child !== null && typeof child === 'object') {
      applyRuleToLeaves(child, rule);
    } else {
      setAtPath(node, [key], maskLeaf(child, rule));
    }
  }
};

/**
 * Builds a stable string key for a resolved path, used to dedupe targets.
 *
 * @param path - The concrete path to key
 */
const pathKey = (path: string[]): string => JSON.stringify(path);
