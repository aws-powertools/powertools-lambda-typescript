const UNSAFE_KEYS = new Set(['__proto__', 'constructor']);

/**
 * Check if a value is a plain object (not a class instance, array, null, etc.)
 *
 * @internal
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Recursively merge source into target.
 *
 * @internal
 */
const mergeRecursive = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  seen: WeakSet<object>
): void => {
  for (const key of Object.keys(source)) {
    if (UNSAFE_KEYS.has(key)) {
      continue;
    }

    const sourceValue = source[key];
    const targetValue = target[key];

    if (Array.isArray(sourceValue)) {
      if (seen.has(sourceValue)) {
        continue;
      }
      seen.add(sourceValue);

      if (Array.isArray(targetValue)) {
        for (let i = 0; i < sourceValue.length; i++) {
          const srcItem = sourceValue[i];
          const tgtItem = targetValue[i];

          if (isPlainObject(srcItem) && isPlainObject(tgtItem)) {
            if (!seen.has(srcItem)) {
              seen.add(srcItem);
              mergeRecursive(tgtItem, srcItem, seen);
            }
          } else {
            targetValue[i] = srcItem;
          }
        }
      } else {
        target[key] = [...sourceValue];
      }
    } else if (isPlainObject(sourceValue)) {
      if (seen.has(sourceValue)) {
        continue;
      }
      seen.add(sourceValue);

      if (isPlainObject(targetValue)) {
        mergeRecursive(targetValue, sourceValue, seen);
      } else {
        const newTarget: Record<string, unknown> = {};
        mergeRecursive(newTarget, sourceValue, seen);
        target[key] = newTarget;
      }
    } else {
      target[key] = sourceValue;
    }
  }
};

/**
 * Recursively merge properties from source objects into the target object, mutating it.
 *
 * Nested plain objects are merged recursively, arrays are merged by index (e.g., `[1, 2]` + `[3]` → `[3, 2]`),
 * and class instances (Date, RegExp, custom classes) are assigned by reference. Circular references and
 * prototype pollution attempts (`__proto__`, `constructor`) are safely skipped.
 *
 * @example
 * ```typescript
 * import { deepMerge } from '@aws-lambda-powertools/commons';
 *
 * const target = { a: 1, nested: { x: 1 } };
 * const source = { b: 2, nested: { y: 2 } };
 * const result = deepMerge(target, source);
 * // result === target === { a: 1, b: 2, nested: { x: 1, y: 2 } }
 * ```
 *
 * @param target - The target object to merge into (mutated)
 * @param sources - One or more source objects to merge from
 */
const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Record<string, unknown> | undefined | null>
): T => {
  const seen = new WeakSet<object>();
  seen.add(target);

  for (const source of sources) {
    if (source != null) {
      seen.add(source);
      mergeRecursive(target, source, seen);
    }
  }

  return target;
};

export { deepMerge };
