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
 * Clone a source item for safe assignment into a target array.
 * Plain objects are cloned via mergeRecursive, arrays via mergeArrayItemsByIndex,
 * and primitives (including undefined) are returned as-is.
 * Returns `{ skip: true }` only when a circular array reference is detected.
 *
 * @internal
 */
const cloneItem = (
  srcItem: unknown,
  ancestors: object[]
): { skip: true } | { skip: false; value: unknown } => {
  if (isPlainObject(srcItem)) {
    const cloned: Record<string, unknown> = {};
    ancestors.push(srcItem);
    mergeRecursive(cloned, srcItem, ancestors);
    ancestors.pop();

    return { skip: false, value: cloned };
  }

  if (Array.isArray(srcItem)) {
    if (ancestors.includes(srcItem)) return { skip: true };
    const cloned: unknown[] = [];
    ancestors.push(srcItem);
    mergeArrayItemsByIndex(cloned, srcItem, ancestors);
    ancestors.pop();

    return { skip: false, value: cloned };
  }

  return { skip: false, value: srcItem };
};

/**
 * Merge a single source item into a target array at the given index.
 *
 * @internal
 */
const mergeArrayItem = (
  targetArray: unknown[],
  index: number,
  srcItem: unknown,
  ancestors: object[]
): void => {
  const tgtItem = targetArray[index];
  const isSrcPlainObject = isPlainObject(srcItem);

  // Skip circular plain object references
  if (isSrcPlainObject && ancestors.includes(srcItem)) return;

  // Merge two plain objects recursively
  if (isSrcPlainObject && isPlainObject(tgtItem)) {
    ancestors.push(srcItem);
    mergeRecursive(tgtItem, srcItem, ancestors);
    ancestors.pop();

    return;
  }

  // Merge two arrays by index
  if (Array.isArray(srcItem) && Array.isArray(tgtItem)) {
    if (!ancestors.includes(srcItem)) {
      ancestors.push(srcItem);
      mergeArrayItemsByIndex(tgtItem, srcItem, ancestors);
      ancestors.pop();
    }

    return;
  }

  // Replace with a cloned copy of the source item
  if (srcItem !== undefined || tgtItem === undefined) {
    const result = cloneItem(srcItem, ancestors);
    if (!result.skip) {
      targetArray[index] = result.value;
    }
  }
};

/**
 * Merge source array items into target array by index.
 *
 * @internal
 */
const mergeArrayItemsByIndex = (
  targetArray: unknown[],
  sourceArray: unknown[],
  ancestors: object[]
): void => {
  for (let i = 0; i < sourceArray.length; i++) {
    mergeArrayItem(targetArray, i, sourceArray[i], ancestors);
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
  ancestors: object[]
): void => {
  if (!Array.isArray(targetValue)) {
    const freshArray: unknown[] = [];
    mergeArrayItemsByIndex(freshArray, sourceArray, ancestors);
    target[key] = freshArray;
    return;
  }

  mergeArrayItemsByIndex(targetValue, sourceArray, ancestors);
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
  ancestors: object[]
): void => {
  if (isPlainObject(targetValue)) {
    mergeRecursive(targetValue, sourceObject, ancestors);
    return;
  }

  const newTarget: Record<string, unknown> = {};
  mergeRecursive(newTarget, sourceObject, ancestors);
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
  ancestors: object[]
): void => {
  for (const key of Object.keys(source)) {
    if (UNSAFE_KEYS.has(key)) {
      continue;
    }

    const sourceValue = source[key];
    const targetValue = target[key];

    if (Array.isArray(sourceValue)) {
      if (ancestors.includes(sourceValue)) continue;
      ancestors.push(sourceValue);
      handleArrayMerge(target, key, sourceValue, targetValue, ancestors);
      ancestors.pop();
      continue;
    }

    if (isPlainObject(sourceValue)) {
      if (ancestors.includes(sourceValue)) continue;
      ancestors.push(sourceValue);
      handleObjectMerge(target, key, sourceValue, targetValue, ancestors);
      ancestors.pop();
      continue;
    }

    if (sourceValue !== undefined || targetValue === undefined) {
      target[key] = sourceValue;
    }
  }
};

/**
 * Recursively merge properties from source objects into the target object, mutating it.
 *
 * Nested plain objects are merged recursively, arrays are merged by index (e.g., `[1, 2]` + `[3]` → `[3, 2]`),
 * and class instances (Date, RegExp, custom classes) are assigned by reference. Circular references are
 * detected via ancestor-chain tracking and safely skipped, while shared (non-circular) object references
 * are merged correctly. Prototype pollution attempts (`__proto__`, `constructor`) are also skipped.
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
  const ancestors: object[] = [target];

  for (const source of sources) {
    if (source != null) {
      ancestors.push(source);
      mergeRecursive(target, source, ancestors);
      ancestors.pop();
    }
  }

  return target;
};

export { deepMerge };
