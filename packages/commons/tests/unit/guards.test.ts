/**
 * Test guards functions
 *
 * @group unit/commons/guards
 */
import {
  isRecord,
  isTruthy,
  isNullOrUndefined,
  isString,
} from '../../src/index.js';

describe('Functions: guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Function: isRecord', () => {
    it('returns true when the passed object is a Record', () => {
      // Prepare
      const obj = { a: 1, b: 2, c: 3 };

      // Act
      const result = isRecord(obj);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when the passed object is not a Record', () => {
      // Prepare
      const obj = [1, 2, 3];

      // Act
      const result = isRecord(obj);

      // Assert
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

        // Assert
        expect(result).toBe(true);
      }
    );

    it.each(['', 0, false, [], {}, Symbol])(
      'returns true when the passed value is falsy',
      (testValue) => {
        // Prepare
        const value = testValue;

        // Act
        const result = isTruthy(value);

        // Assert
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

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when the passed value is not null or undefined', () => {
      // Prepare
      const value = 'hello';

      // Act
      const result = isNullOrUndefined(value);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Function: isString', () => {
    it('returns true when the passed value is a string', () => {
      // Prepare
      const value = 'hello';

      // Act
      const result = isString(value);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when the passed value is not a string', () => {
      // Prepare
      const value = 123;

      // Act
      const result = isString(value);

      // Assert
      expect(result).toBe(false);
    });
  });
});
