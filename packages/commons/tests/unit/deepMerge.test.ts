import { describe, expect, it } from 'vitest';
import { deepMerge } from '../../src/deepMerge.js';

describe('Function: deepMerge', () => {
  describe('Basic merging', () => {
    it('mutates and returns the target object', () => {
      // Prepare
      const target = { a: 1 };
      const source = { b: 2 };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toBe(target);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('merges multiple sources in order', () => {
      // Prepare
      const target = { a: 1 };
      const source1 = { b: 2 };
      const source2 = { c: 3 };
      const source3 = { a: 100 };

      // Act
      const result = deepMerge(target, source1, source2, source3);

      // Assess
      expect(result).toEqual({ a: 100, b: 2, c: 3 });
    });

    it('handles null sources gracefully', () => {
      // Prepare
      const target = { a: 1 };

      // Act
      const result = deepMerge(target, null, { b: 2 }, null);

      // Assess
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('handles undefined sources gracefully', () => {
      // Prepare
      const target = { a: 1 };

      // Act
      const result = deepMerge(target, undefined, { b: 2 }, undefined);

      // Assess
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('handles empty source objects', () => {
      // Prepare
      const target = { a: 1 };

      // Act
      const result = deepMerge(target, {});

      // Assess
      expect(result).toEqual({ a: 1 });
    });

    it('handles empty target object', () => {
      // Prepare
      const target = {};
      const source = { a: 1, b: { c: 2 } };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ a: 1, b: { c: 2 } });
    });
  });

  describe('Deep object merging', () => {
    it('deeply merges nested objects', () => {
      // Prepare
      const target = { nested: { a: 1, b: 2 } };
      const source = { nested: { b: 3, c: 4 } };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ nested: { a: 1, b: 3, c: 4 } });
    });

    it('deeply merges multiple levels of nesting', () => {
      // Prepare
      const target = {
        level1: {
          level2: {
            level3: { a: 1 },
          },
        },
      };
      const source = {
        level1: {
          level2: {
            level3: { b: 2 },
            newKey: 'value',
          },
        },
      };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({
        level1: {
          level2: {
            level3: { a: 1, b: 2 },
            newKey: 'value',
          },
        },
      });
    });

    it('replaces non-object target values with source objects', () => {
      // Prepare
      const target = { a: 'string' } as Record<string, unknown>;
      const source = { a: { nested: 1 } };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ a: { nested: 1 } });
    });

    it('replaces object target values with non-object source values', () => {
      // Prepare
      const target = { a: { nested: 1 } };
      const source = { a: 'string' };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ a: 'string' });
    });
  });

  describe('Multi-source merging', () => {
    it('merges three sources with arrays of objects', () => {
      // Prepare
      const names = { characters: [{ name: 'barney' }, { name: 'fred' }] };
      const ages = { characters: [{ age: 36 }, { age: 40 }] };
      const heights = {
        characters: [{ height: '5\'4"' }, { height: '5\'5"' }],
      };

      // Act
      const result = deepMerge({}, names, ages, heights);

      // Assess
      expect(result).toEqual({
        characters: [
          { name: 'barney', age: 36, height: '5\'4"' },
          { name: 'fred', age: 40, height: '5\'5"' },
        ],
      });
    });
  });

  describe('Array merging (index-based)', () => {
    it('merges arrays by index', () => {
      // Prepare
      const target = { arr: [1, 2, 3] };
      const source = { arr: [10] };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ arr: [10, 2, 3] });
    });

    it('extends array when source has more elements', () => {
      // Prepare
      const target = { arr: [1] };
      const source = { arr: [10, 20, 30] };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ arr: [10, 20, 30] });
    });

    it('merges objects within arrays by index', () => {
      // Prepare
      const target = { arr: [{ a: 1 }, { b: 2 }] };
      const source = { arr: [{ c: 3 }] };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ arr: [{ a: 1, c: 3 }, { b: 2 }] });
    });

    it('replaces non-array target with array source', () => {
      // Prepare
      const target = { arr: 'not an array' } as Record<string, unknown>;
      const source = { arr: [1, 2, 3] };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ arr: [1, 2, 3] });
    });

    it('replaces array target with non-array source', () => {
      // Prepare
      const target = { arr: [1, 2, 3] };
      const source = { arr: 'not an array' };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ arr: 'not an array' });
    });
  });

  describe('Prototype pollution protection', () => {
    it('skips __proto__ keys from source', () => {
      // Prepare
      const target = { a: 1 };
      const source = JSON.parse('{"__proto__": {"polluted": true}, "b": 2}');

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ a: 1, b: 2 });
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it('skips constructor keys from source', () => {
      // Prepare
      const target = { a: 1 };
      const source = { constructor: { polluted: true }, b: 2 } as Record<
        string,
        unknown
      >;

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ a: 1, b: 2 });
      expect(result.constructor).toBe(Object);
    });

    it('does not indirectly pollute via toString.constructor.prototype', () => {
      // Prepare & Act
      deepMerge({}, {
        toString: { constructor: { prototype: { polluted: true } } },
      } as Record<string, unknown>);

      // Assess
      expect('polluted' in Function.prototype).toBe(false);
    });

    it('handles nested __proto__ keys', () => {
      // Prepare
      const target = { nested: { a: 1 } };
      const source = {
        nested: JSON.parse('{"__proto__": {"polluted": true}, "b": 2}'),
      };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ nested: { a: 1, b: 2 } });
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });

  describe('Circular reference protection', () => {
    it('handles circular references in source objects', () => {
      // Prepare
      const target = { a: 1 };
      const source: Record<string, unknown> = { b: 2 };
      source.self = source;

      // Act
      const result = deepMerge(target, source);

      // Assess - self-reference is skipped entirely
      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).not.toHaveProperty('self');
    });

    it('handles deep circular references', () => {
      // Prepare
      const target = { a: 1 };
      const source: Record<string, unknown> = {
        b: 2,
        nested: { c: 3 },
      };
      (source.nested as Record<string, unknown>).circular = source;

      // Act
      const result = deepMerge(target, source);

      // Assess - circular reference is skipped
      expect(result).toEqual({ a: 1, b: 2, nested: { c: 3 } });
    });

    it('handles circular arrays', () => {
      // Prepare
      const target = { a: 1 };
      const circularArr: unknown[] = [1, 2];
      circularArr.push(circularArr);
      const source = { arr: circularArr };

      // Act
      const result = deepMerge(target, source);

      // Assess - circular array reference is preserved in shallow copy
      // (the array itself is copied, but the circular element points to original)
      expect(result.a).toBe(1);
      expect(Array.isArray(result.arr)).toBe(true);
      expect((result.arr as unknown[])[0]).toBe(1);
      expect((result.arr as unknown[])[1]).toBe(2);
    });

    it('skips array that references an ancestor array', () => {
      // Prepare - an array contains an object whose property points back to the array
      const arr: unknown[] = [];
      const inner: Record<string, unknown> = { backRef: arr };
      arr.push(inner);
      const target = { arr: [{ a: 1 }] };
      const source = { arr };

      // Act
      const result = deepMerge(target, source);

      // Assess - inner.backRef is the same array that's in the ancestor chain,
      // so the circular array reference is skipped during mergeRecursive
      expect(result.arr).toBeDefined();
      expect((result.arr as Record<string, unknown>[])[0]).not.toHaveProperty(
        'backRef'
      );
    });

    it('skips circular plain objects inside arrays', () => {
      // Prepare
      const target = { arr: [{ a: 1 }] };
      const source: Record<string, unknown> = { b: 2 };
      source.arr = [source];

      // Act
      const result = deepMerge(target, source);

      // Assess - source inside its own array is a circular ref and is skipped
      expect(result).toEqual({ arr: [{ a: 1 }], b: 2 });
    });

    it('merges shared array references into all properties', () => {
      // Prepare
      const target = {};
      const sharedArray = [1, 2, 3];
      const source = {
        first: sharedArray,
        second: sharedArray,
      };

      // Act
      const result = deepMerge(target, source);

      // Assess - shared (non-circular) array is merged into both properties
      expect(result).toEqual({
        first: [1, 2, 3],
        second: [1, 2, 3],
      });
    });

    it('merges shared objects within arrays', () => {
      // Prepare
      const sharedObj = { shared: true };
      const target = {
        arr: [{ a: 1 }, { b: 2 }],
      };
      const source = {
        prop: sharedObj,
        arr: [sharedObj, { c: 3 }],
      };

      // Act
      const result = deepMerge(target, source);

      // Assess - sharedObj is merged into both prop and arr[0]
      expect(result.prop).toEqual({ shared: true });
      expect((result.arr as Record<string, unknown>[])[0]).toEqual({
        a: 1,
        shared: true,
      });
      expect((result.arr as Record<string, unknown>[])[1]).toEqual({
        b: 2,
        c: 3,
      });
    });

    it('merges shared objects into all referencing properties', () => {
      // Prepare
      const target = {};
      const shared = { value: 42 };
      const source = {
        first: shared,
        second: { nested: shared },
      };

      // Act
      const result = deepMerge(target, source);

      // Assess - shared (non-circular) object appears in both locations
      expect(result).toEqual({
        first: { value: 42 },
        second: { nested: { value: 42 } },
      });
    });
  });

  describe('Shared (non-circular) references', () => {
    it('correctly merges shared array references into both properties', () => {
      // Prepare
      const target = {};
      const sharedArray = [1, 2, 3];
      const source = {
        first: sharedArray,
        second: sharedArray,
      };

      // Act
      const result = deepMerge(target, source);

      // Assess - shared array should be merged into both properties
      expect(result).toEqual({
        first: [1, 2, 3],
        second: [1, 2, 3],
      });
    });

    it('correctly merges shared objects referenced in arrays', () => {
      // Prepare
      const sharedObj = { shared: true };
      const target = {
        arr: [{ a: 1 }, { b: 2 }],
      };
      const source = {
        prop: sharedObj,
        arr: [sharedObj, { c: 3 }],
      };

      // Act
      const result = deepMerge(target, source);

      // Assess - sharedObj should be merged into both prop and arr[0]
      expect(result.prop).toEqual({ shared: true });
      expect((result.arr as Record<string, unknown>[])[0]).toEqual({
        a: 1,
        shared: true,
      });
      expect((result.arr as Record<string, unknown>[])[1]).toEqual({
        b: 2,
        c: 3,
      });
    });

    it('correctly merges shared objects into all referencing properties', () => {
      // Prepare
      const target = {};
      const shared = { value: 42 };
      const source = {
        first: shared,
        second: { nested: shared },
      };

      // Act
      const result = deepMerge(target, source);

      // Assess - shared object should appear in both locations
      expect(result).toEqual({
        first: { value: 42 },
        second: { nested: { value: 42 } },
      });
    });

    it('correctly merges shared objects across multiple sources', () => {
      // Prepare
      const shared = { x: 1 };
      const target = {};
      const source1 = { a: shared };
      const source2 = { b: shared };

      // Act
      const result = deepMerge(target, source1, source2);

      // Assess
      expect(result).toEqual({ a: { x: 1 }, b: { x: 1 } });
    });

    it('correctly merges diamond-shaped shared references', () => {
      // Prepare
      const shared = { value: 'shared' };
      const target = {};
      const source = {
        branch1: { leaf: shared },
        branch2: { leaf: shared },
      };

      // Act
      const result = deepMerge(target, source);

      // Assess - same object at different depths in two branches
      expect(result).toEqual({
        branch1: { leaf: { value: 'shared' } },
        branch2: { leaf: { value: 'shared' } },
      });
    });

    it('merges a shared object that itself contains a circular reference', () => {
      // Prepare
      const shared: Record<string, unknown> = { value: 1 };
      shared.self = shared;
      const target = {};
      const source = {
        first: shared,
        second: { nested: shared },
      };

      // Act
      const result = deepMerge(target, source);

      // Assess - shared object is merged in both locations,
      // but the circular self-reference within it is skipped
      expect(result).toEqual({
        first: { value: 1 },
        second: { nested: { value: 1 } },
      });
    });

    it('merges when source references an object from the target', () => {
      // Prepare
      const inner = { x: 1 };
      const target: Record<string, unknown> = { a: inner };
      const source = { b: inner };

      // Act
      const result = deepMerge(target, source);

      // Assess - inner is not in the ancestor chain when processing source,
      // so it should be merged into both properties
      expect(result).toEqual({
        a: { x: 1 },
        b: { x: 1 },
      });
    });
  });

  describe('Edge cases', () => {
    it('handles Date objects (treats as value, not merged)', () => {
      // Prepare
      const date = new Date('2024-01-01');
      const target = { date: new Date('2023-01-01') };
      const source = { date };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result.date).toBe(date);
    });

    it('handles RegExp objects (treats as value, not merged)', () => {
      // Prepare
      const regex = /test/gi;
      const target = { regex: /old/ };
      const source = { regex };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result.regex).toBe(regex);
    });

    it('handles class instances (treats as value, not merged)', () => {
      // Prepare
      class CustomClass {
        value: number;
        constructor(value: number) {
          this.value = value;
        }
      }
      const instance = new CustomClass(42);
      const target = { obj: { a: 1 } };
      const source = { obj: instance };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result.obj).toBe(instance);
      expect(result.obj).toBeInstanceOf(CustomClass);
    });

    it('handles null values in source', () => {
      // Prepare
      const target = { a: { b: 1 } };
      const source = { a: null };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ a: null });
    });

    it('handles undefined values in source (does not overwrite existing value with `undefined`)', () => {
      // Prepare
      const target = { a: 1, b: 2 };
      const source = { a: undefined, c: undefined };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toStrictEqual({ a: 1, b: 2, c: undefined });
    });

    it('handles undefined values in array of source (does not overwrite existing value with `undefined`)', () => {
      // Prepare
      const target = { arr: [4, 5, 6] };
      const source = { arr: [1, undefined, 3, undefined] };
      source.arr[1] = undefined;

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toStrictEqual({ arr: [1, 5, 3, undefined] });
    });

    it('handles missing values in array of source (does not overwrite existing value with `undefined`)', () => {
      // Prepare
      const target = { arr: [4, 5, 6] };
      const source = { arr: new Array(4) };
      source.arr[0] = 1;
      source.arr[2] = 3;

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toStrictEqual({ arr: [1, 5, 3, undefined] });
    });

    it('handles Symbol keys (ignores them)', () => {
      // Prepare
      const sym = Symbol('test');
      const target = { a: 1 };
      const source = { [sym]: 'symbol value', b: 2 };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ a: 1, b: 2 });
      expect((result as Record<symbol, unknown>)[sym]).toBeUndefined();
    });

    it('handles numeric keys', () => {
      // Prepare
      const target = { 1: 'one' };
      const source = { 2: 'two' };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result).toEqual({ 1: 'one', 2: 'two' });
    });

    it('handles special number values', () => {
      // Prepare
      const target = {};
      const source = {
        inf: Number.POSITIVE_INFINITY,
        negInf: Number.NEGATIVE_INFINITY,
        nan: Number.NaN,
      };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result.inf).toBe(Number.POSITIVE_INFINITY);
      expect(result.negInf).toBe(Number.NEGATIVE_INFINITY);
      expect(Number.isNaN(result.nan)).toBe(true);
    });

    it('handles function values', () => {
      // Prepare
      const fn = () => 42;
      const target = {};
      const source = { fn };

      // Act
      const result = deepMerge(target, source);

      // Assess
      expect(result.fn).toBe(fn);
      expect((result.fn as () => number)()).toBe(42);
    });

    it('replaces function target value with object from later source', () => {
      // Prepare
      const fn = () => 42;
      const source1 = { a: fn } as Record<string, unknown>;
      const source2 = { a: { b: 2 } };

      // Act
      const result = deepMerge({}, source1, source2);

      // Assess - object source overwrites function, not merged into it
      expect(result).toEqual({ a: { b: 2 } });
      expect('b' in (source1.a as object)).toBe(false);
    });

    it('handles self-merge without infinite loop', () => {
      // Prepare
      const object: Record<string, unknown> = { a: 1, b: { c: 2 } };

      // Act
      const result = deepMerge(object, object);

      // Assess - should be a no-op
      expect(result).toBe(object);
      expect(result).toEqual({ a: 1, b: { c: 2 } });
    });
  });
});
