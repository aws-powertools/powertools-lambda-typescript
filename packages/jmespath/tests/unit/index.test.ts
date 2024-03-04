/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/coverage
 */
import { JSONValue } from '@aws-lambda-powertools/commons/types';
import {
  search,
  EmptyExpressionError,
  ArityError,
  LexerError,
  JMESPathError,
  VariadicArityError,
} from '../../src';
import { Functions } from '../../src/Functions.js';
import { Parser } from '../../src/Parser.js';
import { TreeInterpreter } from '../../src/TreeInterpreter.js';

describe('Coverage tests', () => {
  it('does stuff', () => {
    class Test {}
    const test = new Test();

    const result = search('foo', test as unknown as JSONValue);

    expect(result).toBe(test);
  });

  // These expressions tests are not part of the compliance suite, but are added to ensure coverage
  describe('expressions', () => {
    it('throws an error if the expression is not a string', () => {
      // Prepare
      const notAStringExpression = 3;

      // Act & Assess
      expect(() =>
        search(notAStringExpression as unknown as string, {})
      ).toThrow(EmptyExpressionError);
    });

    it('throws a lexer error when encounteirng a single equal for equality', () => {
      // Prepare
      const expression = '=';

      // Act & Assess
      expect(() => {
        search(expression, {});
      }).toThrow(LexerError);
    });

    it('returns null when max_by is called with an empty list', () => {
      // Prepare
      const expression = 'max_by(@, &foo)';

      // Act
      const result = search(expression, []);

      // Assess
      expect(result).toBe(null);
    });

    it('returns null when min_by is called with an empty list', () => {
      // Prepare
      const expression = 'min_by(@, &foo)';

      // Act
      const result = search(expression, []);

      // Assess
      expect(result).toBe(null);
    });

    it('returns the correct max value', () => {
      // Prepare
      const expression = 'max(@)';

      // Act
      const result = search(expression, ['z', 'b']);

      // Assess
      expect(result).toBe('z');
    });

    it('returns the correct min value', () => {
      // Prepare
      const expression = 'min(@)';

      // Act
      const result = search(expression, ['z', 'b']);

      // Assess
      expect(result).toBe('b');
    });
  });

  describe('type checking', () => {
    class TestFunctions extends Functions {
      @TestFunctions.signature({
        argumentsSpecs: [['any'], ['any']],
      })
      public funcTest(): void {
        return;
      }

      @TestFunctions.signature({
        argumentsSpecs: [['any'], ['any']],
        variadic: true,
      })
      public funcTestArityError(): void {
        return;
      }
    }

    it('throws an arity error if the function is called with the wrong number of arguments', () => {
      // Prepare
      const expression = 'test(@, @, @)';

      // Act & Assess
      expect(() =>
        search(expression, {}, { customFunctions: new TestFunctions() })
      ).toThrow(ArityError);
    });

    it('throws an arity error if the function is called with the wrong number of arguments', () => {
      // Prepare
      const expression = 'test_arity_error(@)';

      // Act & Assess
      expect(() =>
        search(expression, {}, { customFunctions: new TestFunctions() })
      ).toThrow(VariadicArityError);
    });
  });

  describe('class: Parser', () => {
    it('clears the cache when purgeCache is called', () => {
      // Prepare
      const parser = new Parser();

      // Act
      const parsedResultA = parser.parse('test(@, @)');
      parser.purgeCache();
      const parsedResultB = parser.parse('test(@, @)');

      // Assess
      expect(parsedResultA).not.toBe(parsedResultB);
    });
  });

  describe('class: TreeInterpreter', () => {
    it('throws an error when visiting an invalid node', () => {
      // Prepare
      const interpreter = new TreeInterpreter();

      // Act & Assess
      expect(() => {
        interpreter.visit(
          {
            type: 'invalid',
            value: 'invalid',
            children: [],
          },
          {}
        );
      }).toThrow(JMESPathError);
    });

    it('returns null when visiting a field with no value', () => {
      // Prepare
      const interpreter = new TreeInterpreter();

      // Act
      const result = interpreter.visit(
        {
          type: 'field',
          value: undefined,
          children: [],
        },
        {}
      );

      // Assess
      expect(result).toBe(null);
    });

    it('throws an error when receiving an invalid comparator', () => {
      // Prepare
      const interpreter = new TreeInterpreter();

      // Act & Assess
      expect(() => {
        interpreter.visit(
          {
            type: 'comparator',
            value: 'invalid',
            children: [
              {
                type: 'field',
                value: 'a',
                children: [],
              },
              {
                type: 'field',
                value: 'b',
                children: [],
              },
            ],
          },
          {}
        );
      }).toThrow(JMESPathError);
    });

    it('throws an error when receiving a function with an invalid name', () => {
      // Prepare
      const interpreter = new TreeInterpreter();

      // Act & Assess
      expect(() => {
        interpreter.visit(
          {
            type: 'function_expression',
            value: 1, // function name must be a string
            children: [],
          },
          {}
        );
      }).toThrow(JMESPathError);
    });

    it('throws an error when receiving an index expression with an invalid index', () => {
      // Prepare
      const interpreter = new TreeInterpreter();

      // Act & Assess
      expect(() => {
        interpreter.visit(
          {
            type: 'index',
            value: 'invalid', // index must be a number
            children: [],
          },
          []
        );
      }).toThrow(JMESPathError);
    });

    it('returns an empty array when slicing an empty array', () => {
      // Prepare
      const interpreter = new TreeInterpreter();

      // Act
      const result = interpreter.visit(
        {
          type: 'slice',
          value: [0, 0, 1],
          children: [],
        },
        []
      );

      // Assess
      expect(result).toEqual([]);
    });
  });
});
