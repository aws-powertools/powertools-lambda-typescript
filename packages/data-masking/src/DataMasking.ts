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
   * Irreversibly mask the entire payload with the default mask value:
   * arrays element-wise preserving their length, and everything else
   * with a single mask string.
   *
   * @param data - The data to mask; returned as-is when `null` or `undefined`
   */
  erase<T>(data: T): MaskedPayload<T>;
  /**
   * Irreversibly mask fields in a data object. Returns a deep copy.
   *
   * The options compose three layers (see {@link EraseOptions}):
   * - a top-level {@link MaskingRule} (`regexPattern` + `maskFormat`, `dynamicMask`,
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
   * @param options - Options for the operation, see {@link EraseOptions}
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

    // Resolve every path against the untouched copy before masking anything, so a
    // rule that collapses a parent cannot make another expression's path vanish.
    const targets: MaskTarget[] = [];
    const overridden = new Set<string>();
    for (const [field, rule] of Object.entries(maskingRules ?? {})) {
      for (const path of this.#resolvePathsOrReportMissing(copy, field)) {
        targets.push({ path, rule });
        overridden.add(pathKey(path));
      }
    }
    for (const field of fields ?? []) {
      for (const path of this.#resolvePathsOrReportMissing(copy, field)) {
        // Per-field rules win over the top-level rule for the paths they name.
        if (overridden.has(pathKey(path))) continue;
        targets.push({
          path,
          rule: hasTopLevelRule ? topLevelRule : undefined,
        });
      }
    }

    // Deepest paths first, so masking a parent never traverses a leaf that has
    // already been replaced with a string.
    targets.sort((a, b) => b.path.length - a.path.length);
    for (const { path, rule } of targets) {
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
   * Encrypt data using the configured provider. With fields, encrypts
   * specific values in place. Without fields, encrypts the entire payload.
   *
   * @example
   * ```typescript
   * const encrypted = await masker.encrypt(data, {
   *   fields: ['customer.ssn'],
   *   context: { tenantId: 'acme' },
   * });
   * ```
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
    await this.#transformFields(copy, options.fields, (value) => {
      return provider.encrypt(JSON.stringify(value), options.context);
    });

    return copy;
  }

  /**
   * Decrypt data using the configured provider. Automatically detects
   * full-payload (string input) vs field-level (object input) format.
   *
   * @example
   * ```typescript
   * const decrypted = await masker.decrypt(encrypted, {
   *   fields: ['customer.ssn'],
   * });
   * ```
   */
  async decrypt<T>(data: T | string, options?: DecryptOptions): Promise<T> {
    const provider = this.#requireProvider();

    if (typeof data === 'string') {
      return JSON.parse(await provider.decrypt(data, options?.context)) as T;
    }

    const copy = this.#deepCopy(data);
    if (options?.fields) {
      await this.#transformFields(copy, options.fields, async (value) => {
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

  #requireProvider(): EncryptionProvider {
    if (!this.#provider) {
      throw new DataMaskingEncryptionError(
        'Encryption provider is required for encrypt/decrypt operations'
      );
    }

    return this.#provider;
  }

  #deepCopy<T>(data: T): T {
    try {
      return structuredClone(data);
    } catch {
      throw new DataMaskingUnsupportedTypeError(
        'Data contains unsupported types for cloning'
      );
    }
  }

  async #transformFields<T>(
    data: T,
    fields: string[],
    transform: (value: unknown) => Promise<unknown>
  ): Promise<void> {
    const operations: Promise<void>[] = [];

    for (const field of fields) {
      for (const path of this.#resolvePathsOrReportMissing(data, field)) {
        operations.push(
          transform(getAtPath(data, path)).then((result) =>
            setAtPath(data, path, result)
          )
        );
      }
    }

    await Promise.all(operations);
  }

  /**
   * Resolve a path expression, throwing or warning per `throwOnMissingField`
   * when it matches nothing in the data.
   */
  #resolvePathsOrReportMissing(data: unknown, field: string): string[][] {
    const paths = this.#resolveFieldPaths(data, field);
    if (paths.length === 0) {
      if (this.#throwOnMissingField) {
        throw new DataMaskingFieldNotFoundError(`Field not found: '${field}'`);
      }
      console.warn(`Field not found: '${field}'`);
    }

    return paths;
  }

  /**
   * Expand a path expression into every concrete path it matches in `data`.
   *
   * Reserved keys (`__proto__`, `constructor`, `prototype`) never resolve, whether
   * named directly or reached through a wildcard, which is what keeps the later
   * in-place assignment free of prototype pollution.
   */
  #resolveFieldPaths(data: unknown, expression: string): string[][] {
    const segments = expression.split(/\.|\[(\*)\]\.?/).filter(Boolean);
    if (segments.length === 0) return [];

    const paths: string[][] = [];
    const walk = (obj: unknown, i: number, current: string[]): void => {
      if (i === segments.length) {
        paths.push(current);

        return;
      }
      if (obj == null || typeof obj !== 'object') return;

      for (const [key, child] of resolveWildcardEntries(obj, segments[i])) {
        walk(child, i + 1, [...current, key]);
      }
    };

    walk(data, 0, []);

    return paths;
  }
}

const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** A resolved concrete path and the rule to mask it with; no rule means the default mask. */
type MaskTarget = { path: string[]; rule?: MaskingRule };

const resolveWildcardEntries = (
  obj: object,
  segment: string
): [string, unknown][] => {
  if (segment !== '*') {
    // A present key with an `undefined` value still resolves; only absent keys do not.
    if (RESERVED_KEYS.has(segment) || !Object.hasOwn(obj, segment)) return [];

    return [[segment, (obj as Record<string, unknown>)[segment]]];
  }
  if (Array.isArray(obj)) {
    return obj.map((v, i) => [String(i), v]);
  }

  return Object.keys(obj)
    .filter((k) => !RESERVED_KEYS.has(k))
    .map((k) => [k, (obj as Record<string, unknown>)[k]]);
};

const getAtPath = (data: unknown, path: string[]): unknown => {
  let current = data as Record<string, unknown>;
  for (const key of path) {
    current = current[key] as Record<string, unknown>;
  }

  return current;
};

/**
 * Set `value` at the location identified by `path`, mutating `data` in place.
 *
 * Walks every path segment except the last to reach the parent container, then
 * assigns the value to the final segment. Assumes the path was produced by
 * `#resolveFieldPaths` against the same object, so it is non-empty, free of
 * reserved keys, and its intermediate containers exist.
 */
const setAtPath = (data: unknown, path: string[], value: unknown): void => {
  let current = data as Record<string, unknown>;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
};

/**
 * Apply a single {@link MaskingRule} to a string value.
 *
 * The strategies are mutually exclusive by construction (see {@link MaskingRule}),
 * so each branch checks for the one property that identifies its variant.
 */
const applyMaskingRule = (value: string, rule: MaskingRule): string => {
  if (rule.regexPattern)
    return value.replace(rule.regexPattern, rule.maskFormat);
  // Checked against `undefined` so an intentional empty-string mask is honoured.
  if (rule.customMask !== undefined) return rule.customMask;
  if (rule.dynamicMask) return '*'.repeat(value.length);

  return DEFAULT_MASK_VALUE;
};

/** Whether a top-level rule object actually configures a masking strategy. */
const isMaskingRule = (rule: MaskingRule): boolean =>
  rule.regexPattern !== undefined ||
  rule.customMask !== undefined ||
  rule.dynamicMask !== undefined;

/**
 * Mask a single leaf value with a rule.
 *
 * Leaves are stringified first so the rule applies uniformly to non-string
 * primitives (e.g. `dynamicMask` over a number), matching erase's contract that
 * masked values become strings. `null`/`undefined` pass through unchanged.
 */
const maskLeaf = (value: unknown, rule: MaskingRule): unknown =>
  isNullOrUndefined(value) ? value : applyMaskingRule(String(value), rule);

/** Recursively apply a rule to every leaf value, mutating `node` in place. */
const applyRuleToLeaves = (node: object, rule: MaskingRule): void => {
  const entries: [string, unknown][] = Array.isArray(node)
    ? node.map((v, i) => [String(i), v])
    : Object.keys(node)
        .filter((k) => !RESERVED_KEYS.has(k))
        .map((k) => [k, (node as Record<string, unknown>)[k]]);

  for (const [key, child] of entries) {
    if (child !== null && typeof child === 'object') {
      applyRuleToLeaves(child, rule);
    } else {
      (node as Record<string, unknown>)[key] = maskLeaf(child, rule);
    }
  }
};

/** Stable string key for a resolved path, used to dedupe overridden paths. */
const pathKey = (path: string[]): string => JSON.stringify(path);
