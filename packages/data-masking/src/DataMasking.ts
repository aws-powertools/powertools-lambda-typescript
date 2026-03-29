import { search } from '@aws-lambda-powertools/jmespath';
import { DEFAULT_MASK_VALUE } from './constants.js';
import {
  DataMaskingEncryptionError,
  DataMaskingFieldNotFoundError,
  DataMaskingUnsupportedTypeError,
} from './errors.js';
import type {
  DataMaskingConstructorOptions,
  DecryptOptions,
  EncryptOptions,
  EncryptionProvider,
  EraseOptions,
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
  readonly #provider?: EncryptionProvider;
  readonly #throwOnMissingField: boolean;

  constructor(options?: DataMaskingConstructorOptions) {
    this.#provider = options?.provider;
    this.#throwOnMissingField = options?.throwOnMissingField ?? true;
  }

  /**
   * Irreversibly mask fields in a data object. Returns a deep copy.
   *
   * @example
   * ```typescript
   * const masked = masker.erase(data, { fields: ['email', 'customer.ssn'] });
   * ```
   */
  erase<T>(data: T, options?: EraseOptions): T {
    if (data === null || data === undefined) return data;
    if (!options?.fields && !options?.maskingRules) {
      return DEFAULT_MASK_VALUE as unknown as T;
    }

    const copy = this.#deepCopy(data);

    if (options.maskingRules) {
      for (const [field, rule] of Object.entries(options.maskingRules)) {
        for (const path of this.#resolveFieldPaths(copy as Record<string, unknown>, field)) {
          const value = getAtPath(copy, path);
          if (typeof value !== 'string') {
            throw new DataMaskingUnsupportedTypeError(
              `Masking rules only support string values, got ${typeof value} at path '${field}'`
            );
          }
          setAtPath(copy, path, applyMaskingRule(value, rule));
        }
      }

      return copy;
    }

    for (const field of options.fields ?? []) {
      const paths = this.#resolveFieldPaths(copy as Record<string, unknown>, field);
      if (paths.length === 0 && this.#throwOnMissingField) {
        throw new DataMaskingFieldNotFoundError(`Field not found: '${field}'`);
      }
      for (const path of paths) {
        setAtPath(copy, path, DEFAULT_MASK_VALUE);
      }
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
      return provider.encrypt(JSON.stringify(data), options?.context);
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
        if (typeof value !== 'string') return value;

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
      for (const path of this.#resolveFieldPaths(data as Record<string, unknown>, field)) {
        operations.push(
          transform(getAtPath(data, path)).then((result) =>
            setAtPath(data, path, result)
          )
        );
      }
    }

    await Promise.all(operations);
  }

  #resolveFieldPaths(data: Record<string, unknown>, expression: string): string[][] {
    // JMESPath validates the expression and checks if it matches anything
    const matched = search(expression, data);
    if (matched == null || (Array.isArray(matched) && matched.length === 0)) {
      return [];
    }

    // Walk the data to resolve wildcards into concrete paths for write-back
    const segments = expression.split(/\.|\[(\*)\]\.?/).filter(Boolean);

    const paths: string[][] = [];
    const walk = (obj: unknown, i: number, current: string[]): void => {
      if (i === segments.length) {
        paths.push(current);

        return;
      }
      if (obj == null || typeof obj !== 'object') return;

      if (segments[i] === '*') {
        if (!Array.isArray(obj)) return;
        for (let j = 0; j < obj.length; j++) {
          walk(obj[j], i + 1, [...current, String(j)]);
        }
      } else {
        const next = (obj as Record<string, unknown>)[segments[i]];
        if (next !== undefined) {
          walk(next, i + 1, [...current, segments[i]]);
        }
      }
    };

    walk(data, 0, []);

    return paths;
  }
}

const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function getAtPath(data: unknown, path: string[]): unknown {
  let current = data;
  for (const key of path) {
    if (RESERVED_KEYS.has(key)) return undefined;
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function setAtPath(data: unknown, path: string[], value: unknown): void {
  let current = data;
  for (let i = 0; i < path.length - 1; i++) {
    if (RESERVED_KEYS.has(path[i])) return;
    if (current == null || typeof current !== 'object') return;
    current = (current as Record<string, unknown>)[path[i]];
  }
  const lastKey = path[path.length - 1];
  if (RESERVED_KEYS.has(lastKey)) return;
  if (current != null && typeof current === 'object') {
    (current as Record<string, unknown>)[lastKey] = value;
  }
}

function applyMaskingRule(value: string, rule: MaskingRule): string {
  if (rule.regexPattern && rule.maskFormat) {
    return value.replace(rule.regexPattern, rule.maskFormat);
  }
  if (rule.dynamicMask) return '*'.repeat(value.length);
  if (rule.customMask !== undefined) return rule.customMask;

  return DEFAULT_MASK_VALUE;
}
