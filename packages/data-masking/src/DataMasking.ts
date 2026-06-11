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
   * @example
   * ```typescript
   * const masked = masker.erase(data, { fields: ['email', 'customer.ssn'] });
   * ```
   *
   * @param data - The data to mask; returned as-is when `null` or `undefined`
   * @param options - Options for the operation, see {@link EraseOptions}: either `fields` (dot-notation path expressions supporting `.*` and `[*]` wildcards) or `maskingRules` (per-field custom rules keyed by path)
   */
  erase<T>(data: T, options: EraseOptions): T;
  erase(data: unknown, options?: EraseOptions): unknown {
    if (isNullOrUndefined(data)) return data;
    const fields = options?.fields;
    const maskingRules = options?.maskingRules;
    if (!fields && !maskingRules) {
      return Array.isArray(data)
        ? data.map(() => DEFAULT_MASK_VALUE)
        : DEFAULT_MASK_VALUE;
    }

    const copy = this.#deepCopy(data);

    if (maskingRules) {
      this.#applyMaskingRules(copy, maskingRules);
    } else {
      /* v8 ignore next -- @preserve fallback unreachable: the early return above means fields is defined here */
      this.#eraseFields(copy, fields ?? []);
    }

    return copy;
  }

  #applyMaskingRules<T>(copy: T, rules: Record<string, MaskingRule>): void {
    for (const [field, rule] of Object.entries(rules)) {
      for (const path of this.#resolveFieldPaths(
        copy as Record<string, unknown>,
        field
      )) {
        const value = getAtPath(copy, path);
        if (!isString(value)) {
          throw new DataMaskingUnsupportedTypeError(
            `Masking rules only support string values, got ${typeof value} at path '${field}'`
          );
        }
        setAtPath(copy, path, applyMaskingRule(value, rule));
      }
    }
  }

  #eraseFields<T>(copy: T, fields: string[]): void {
    for (const field of fields) {
      const paths = this.#resolveFieldPaths(
        copy as Record<string, unknown>,
        field
      );
      if (paths.length === 0) {
        if (this.#throwOnMissingField) {
          throw new DataMaskingFieldNotFoundError(
            `Field not found: '${field}'`
          );
        }
        console.warn(`Field not found: '${field}'`);
      }
      for (const path of paths) {
        setAtPath(copy, path, DEFAULT_MASK_VALUE);
      }
    }
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
      for (const path of this.#resolveFieldPaths(
        data as Record<string, unknown>,
        field
      )) {
        operations.push(
          transform(getAtPath(data, path)).then((result) =>
            setAtPath(data, path, result)
          )
        );
      }
    }

    await Promise.all(operations);
  }

  #resolveFieldPaths(
    data: Record<string, unknown>,
    expression: string
  ): string[][] {
    const segments = expression.split(/\.|\[(\*)\]\.?/).filter(Boolean);

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

const resolveWildcardEntries = (
  obj: object,
  segment: string
): [string, unknown][] => {
  if (segment !== '*') {
    const next = (obj as Record<string, unknown>)[segment];

    if (next === undefined) return [];

    return [[segment, next]];
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
    if (RESERVED_KEYS.has(key)) return undefined;
    current = current[key] as Record<string, unknown>;
  }

  return current;
};

/**
 * Set `value` at the location identified by `path`, mutating `data` in place.
 *
 * Walks every path segment except the last to reach the parent container,
 * then assigns the value to the final segment. Assumes the path was produced
 * by `#resolveFieldPaths` against the same object, so intermediate containers
 * are known to exist. Assignments to reserved keys (`__proto__`, `constructor`,
 * `prototype`) are skipped to prevent prototype pollution.
 */
const setAtPath = (data: unknown, path: string[], value: unknown): void => {
  let current = data as Record<string, unknown>;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]] as Record<string, unknown>;
  }
  const lastKey = path.at(-1);
  if (!lastKey || RESERVED_KEYS.has(lastKey)) return;
  current[lastKey] = value;
};

/**
 * Apply a single masking rule to a string value.
 *
 * The {@link MaskingRule} type makes the strategies mutually exclusive, but
 * JavaScript callers can still pass conflicting options - the precedence is
 * regex+format, then custom mask, then dynamic mask.
 */
const applyMaskingRule = (value: string, rule: MaskingRule): string => {
  if (rule.regexPattern && rule.maskFormat) {
    return value.replace(rule.regexPattern, rule.maskFormat);
  }
  if (rule.customMask !== undefined) return rule.customMask;
  if (rule.dynamicMask === true) return '*'.repeat(value.length);

  return DEFAULT_MASK_VALUE;
};
