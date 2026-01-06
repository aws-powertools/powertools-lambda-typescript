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
 * Merge source array items into target array by index.
 *
 * When both source and target items at the same index are plain objects,
 * they are merged recursively. Otherwise, the source item replaces the target.
 *
 * @internal
 */
const mergeArrayItemsByIndex = (
  targetArray: unknown[],
  sourceArray: unknown[],
  seen: WeakSet<object>
): void => {
  for (let i = 0; i < sourceArray.length; i++) {
    const srcItem = sourceArray[i];
    const tgtItem = targetArray[i];

    const isSrcPlainObject = isPlainObject(srcItem);

    // Skip already-seen objects to prevent circular references
    if (isSrcPlainObject && seen.has(srcItem)) {
      continue;
    }

    // Merge nested plain objects recursively
    if (isSrcPlainObject && isPlainObject(tgtItem)) {
      seen.add(srcItem);
      mergeRecursive(tgtItem, srcItem, seen);
      continue;
    }

    // Otherwise, replace the target item with source item
    targetArray[i] = srcItem;
  }
};

/**
 * Handle merging when source value is an array.
 *
 * @internal
 */
const handleArrayMerge = (
  target: Record<string, unknown>,
  key: string,
  sourceArray: unknown[],
  targetValue: unknown,
  seen: WeakSet<object>
): void => {
  if (!Array.isArray(targetValue)) {
    target[key] = [...sourceArray];
    return;
  }

  mergeArrayItemsByIndex(targetValue, sourceArray, seen);
};

/**
 * Handle merging when source value is a plain object.
 *
 * @internal
 */
const handleObjectMerge = (
  target: Record<string, unknown>,
  key: string,
  sourceObject: Record<string, unknown>,
  targetValue: unknown,
  seen: WeakSet<object>
): void => {
  if (isPlainObject(targetValue)) {
    mergeRecursive(targetValue, sourceObject, seen);
    return;
  }

  const newTarget: Record<string, unknown> = {};
  mergeRecursive(newTarget, sourceObject, seen);
  target[key] = newTarget;
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
      if (seen.has(sourceValue)) continue;
      seen.add(sourceValue);
      handleArrayMerge(target, key, sourceValue, targetValue, seen);
      continue;
    }

    if (isPlainObject(sourceValue)) {
      if (seen.has(sourceValue)) continue;
      seen.add(sourceValue);
      handleObjectMerge(target, key, sourceValue, targetValue, seen);
      continue;
    }

    target[key] = sourceValue;
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
