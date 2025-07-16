import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getType,
  isIntegerNumber,
  isNull,
  isNullOrUndefined,
  isNumber,
  isRecord,
  isStrictEqual,
  isString,
  isStringUndefinedNullEmpty,
  isTruthy,
} from '../../src/index.js';

describe('Functions: typeUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('Function: isRecord', () => {
    it('returns true when the passed object is a Record', () => {
      // Prepare
      const obj = { a: 1, b: 2, c: 3 };

      // Act
      const result = isRecord(obj);

      // Assess
      expect(result).toBe(true);
    });

    it('returns false when the passed object is not a Record', () => {
      // Prepare
      const obj = [1, 2, 3];

      // Act
      const result = isRecord(obj);

      // Assess
      expect(result).toBe(false);
    });
  });

  describe('Function: isTruthy', () => {
    it.each(['hello', 1, true, [1], { foo: 1 }])(
      'returns true when the passed value is truthy',
      (testValue) => {
        // Prepare
        const value = testValue;

        // Act
        const result = isTruthy(value);

        // Assess
        expect(result).toBe(true);
      }
    );

    it.each(['', 0, false, [], {}, Symbol])(
      'returns false when the passed value is falsy',
      (testValue) => {
        // Prepare
        const value = testValue;

        // Act
        const result = isTruthy(value);

        // Assess
        expect(result).toBe(false);
      }
    );
  });

  describe('Function: isNullOrUndefined', () => {
    it('returns true when the passed value is null or undefined', () => {
      // Prepare
      const value = undefined;

      // Act
      const result = isNullOrUndefined(value);

      // Assess
      expect(result).toBe(true);
    });

    it('returns false when the passed value is not null or undefined', () => {
      // Prepare
      const value = 'hello';

      // Act
      const result = isNullOrUndefined(value);

      // Assess
      expect(result).toBe(false);
    });
  });

  describe('Function: isString', () => {
    it('returns true when the passed value is a string', () => {
      // Prepare
      const value = 'hello';

      // Act
      const result = isString(value);

      // Assess
      expect(result).toBe(true);
    });

    it('returns false when the passed value is not a string', () => {
      // Prepare
      const value = 123;

      // Act
      const result = isString(value);

      // Assess
      expect(result).toBe(false);
    });
  });

  describe('Function: isStringUndefinedNullEmpty', () => {
    it('returns true if input is undefined', () => {
      // Act & Assess
      expect(isStringUndefinedNullEmpty(undefined)).toBe(true);
    });

    it('returns true if input is null', () => {
      // Act & Assess
      expect(isStringUndefinedNullEmpty(null)).toBe(true);
    });

    it('returns true if input is an empty string', () => {
      // Act & Assess
      expect(isStringUndefinedNullEmpty('')).toBe(true);
    });

    it('returns true if input is a whitespace', () => {
      // Act & Assess
      expect(isStringUndefinedNullEmpty(' ')).toBe(true);
    });

    it('returns true if input is not a string', () => {
      // Act & Assess
      expect(isStringUndefinedNullEmpty(1)).toBe(true);
    });

    it('returns false if input is not undefined, null, or an empty string', () => {
      // Act & Assess
      expect(isStringUndefinedNullEmpty('test')).toBe(false);
    });
  });

  describe('Function: isNumber', () => {
    it('returns true when the passed value is a number', () => {
      // Prepare
      const value = 123;

      // Act
      const result = isNumber(value);

      // Assess
      expect(result).toBe(true);
    });

    it('returns false when the passed value is not a number', () => {
      // Prepare
      const value = 'hello';

      // Act
      const result = isNumber(value);

      // Assess
      expect(result).toBe(false);
    });
  });

  describe('Function: isIntegerNumber', () => {
    it('returns true when the passed value is an integer number', () => {
      // Prepare
      const value = 123;

      // Act
      const result = isIntegerNumber(value);

      // Assess
      expect(result).toBe(true);
    });

    it('returns false when the passed value is not an integer number', () => {
      // Prepare
      const value = 123.45;

      // Act
      const result = isIntegerNumber(value);

      // Assess
      expect(result).toBe(false);
    });
  });

  describe('Function: isNull', () => {
    it('returns true when the passed value is null', () => {
      // Prepare
      const value = null;

      // Act
      const result = isNull(value);

      // Assess
      expect(result).toBe(true);
    });

    it('returns false when the passed value is not null', () => {
      // Prepare
      const value = 'hello';

      // Act
      const result = isNull(value);

      // Assess
      expect(result).toBe(false);
    });
  });

  describe('Function: getType', () => {
    it.each([
      {
        value: [],
        expected: 'array',
      },
      {
        value: {},
        expected: 'object',
      },
      {
        value: 'hello',
        expected: 'string',
      },
      {
        value: 123,
        expected: 'number',
      },
      {
        value: true,
        expected: 'boolean',
      },
      {
        value: null,
        expected: 'null',
      },
      {
        value: undefined,
        expected: 'unknown',
      },
    ])(
      'returns the correct type when passed type $expected',
      ({ value, expected }) => {
        // Act
        const result = getType(value);

        // Assess
        expect(result).toBe(expected);
      }
    );
  });

  describe('Function: isStrictEqual', () => {
    it('returns true when the passed values are strictly equal', () => {
      // Prepare
      const value1 = 123;
      const value2 = 123;

      // Act
      const result = isStrictEqual(value1, value2);

      // Assess
      expect(result).toBe(true);
    });

    it('returns true when the passed arrays are strictly equal', () => {
      // Prepare
      const value1 = [1, 2, 3];
      const value2 = [1, 2, 3];

      // Act
      const result = isStrictEqual(value1, value2);

      // Assess
      expect(result).toBe(true);
    });

    it('returns true when the passed objects are strictly equal', () => {
      // Prepare
      const value1 = { a: 1, b: 2, c: 3 };
      const value2 = { a: 1, b: 2, c: 3 };

      // Act
      const result = isStrictEqual(value1, value2);

      // Assess
      expect(result).toBe(true);
    });

    it('returns false when the passed values are not strictly equal', () => {
      // Prepare
      const value1 = 123;
      const value2 = '123';

      // Act
      const result = isStrictEqual(value1, value2);

      // Assess
      expect(result).toBe(false);
    });

    it.each([
      {
        value1: [1, 2, 3],
        value2: [1, 3, 2],
      },
      {
        value1: [1, 2, 3],
        value2: [1, 2],
      },
    ])(
      'returns false when the passed arrays are not strictly equal',
      ({ value1, value2 }) => {
        // Act
        const result = isStrictEqual(value1, value2);

        // Assess
        expect(result).toBe(false);
      }
    );

    it.each([
      {
        value1: { a: 1, b: 2, c: 3 },
        value2: { a: 1, b: 3, c: 2 },
      },
      {
        value1: { a: 1, b: 2, c: 3 },
        value2: { a: 1, b: 2 },
      },
    ])(
      'returns false when the passed objects are not strictly equal',
      ({ value1, value2 }) => {
        // Act
        const result = isStrictEqual(value1, value2);

        // Assess
        expect(result).toBe(false);
      }
    );
  });
});
