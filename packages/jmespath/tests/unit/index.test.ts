/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/coverage
 */
import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';
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
import { brotliDecompressSync } from 'node:zlib';
import { PowertoolsFunctions } from '../../src/PowertoolsFunctions.js';
import { extractDataFromEnvelope, SQS } from '../../src/envelopes.js';

describe('Coverage tests', () => {
  // These expressions tests are not part of the compliance suite, but are added to ensure coverage
  describe('expressions', () => {
    it('throws an error if the index is an invalid value', () => {
      // Prepare
      const invalidIndexExpression = 'foo.*.notbaz[-a]';

      // Act & Assess
      expect(() => search(invalidIndexExpression, {})).toThrow(LexerError);
    });

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

  describe('function: extractDataFromEnvelope', () => {
    it('extracts the data from a known envelope', () => {
      // Prepare
      const event = {
        Records: [
          {
            body: '{"foo":"bar"}',
          },
        ],
      };

      // Act
      const data = extractDataFromEnvelope(event, SQS);

      // Assess
      expect(data).toStrictEqual([{ foo: 'bar' }]);
    });
  });

  describe('class: PowertoolsFunctions', () => {
    it('decodes a json string', () => {
      // Prepare
      const event = '{"user":"xyz","product_id":"123456789"}';

      // Act
      const data = extractDataFromEnvelope(event, 'powertools_json(@)', {
        customFunctions: new PowertoolsFunctions(),
      });

      // Assess
      expect(data).toStrictEqual({
        user: 'xyz',
        product_id: '123456789',
      });
    });

    it('decodes a base64 gzip string', () => {
      // Prepare
      const event = {
        payload:
          'H4sIACZAXl8C/52PzUrEMBhFX2UILpX8tPbHXWHqIOiq3Q1F0ubrWEiakqTWofTdTYYB0YWL2d5zvnuTFellBIOedoiyKH5M0iwnlKH7HZL6dDB6ngLDfLFYctUKjie9gHFaS/sAX1xNEq525QxwFXRGGMEkx4Th491rUZdV3YiIZ6Ljfd+lfSyAtZloacQgAkqSJCGhxM6t7cwwuUGPz4N0YKyvO6I9WDeMPMSo8Z4Ca/kJ6vMEYW5f1MX7W1lVxaG8vqX8hNFdjlc0iCBBSF4ERT/3Pl7RbMGMXF2KZMh/C+gDpNS7RRsp0OaRGzx0/t8e0jgmcczyLCWEePhni/23JWalzjdu0a3ZvgEaNLXeugEAAA==',
      };

      // Act
      const data = extractDataFromEnvelope(
        event,
        'powertools_base64_gzip(payload) | powertools_json(@).logGroup',
        {
          customFunctions: new PowertoolsFunctions(),
        }
      );

      // Assess
      expect(data).toStrictEqual('/aws/lambda/powertools-example');
    });

    it('decodes a base64 string', () => {
      // Prepare
      const event = {
        payload:
          'eyJ1c2VyX2lkIjogMTIzLCAicHJvZHVjdF9pZCI6IDEsICJxdWFudGl0eSI6IDIsICJwcmljZSI6IDEwLjQwLCAiY3VycmVuY3kiOiAiVVNEIn0=',
      };

      // Act
      const data = extractDataFromEnvelope(
        event,
        'powertools_json(powertools_base64(payload))',
        {
          customFunctions: new PowertoolsFunctions(),
        }
      );

      // Assess
      expect(data).toStrictEqual({
        user_id: 123,
        product_id: 1,
        quantity: 2,
        price: 10.4,
        currency: 'USD',
      });
    });

    it('uses the custom function extending the powertools custom functions', () => {
      // Prepare
      class CustomFunctions extends PowertoolsFunctions {
        public constructor() {
          super();
        }
        @PowertoolsFunctions.signature({
          argumentsSpecs: [['string']],
        })
        public funcDecodeBrotliCompression(value: string): string {
          const encoded = fromBase64(value, 'base64');
          const uncompressed = brotliDecompressSync(encoded);

          return uncompressed.toString();
        }
      }
      const event = {
        Records: [
          {
            application: 'messaging-app',
            datetime: '2022-01-01T00:00:00.000Z',
            notification: 'GyYA+AXhZKk/K5DkanoQSTYpSKMwwxXh8DRWVo9A1hLqAQ==',
          },
        ],
      };

      // Act
      const messages = extractDataFromEnvelope<string>(
        event,
        'Records[*].decode_brotli_compression(notification) | [*].powertools_json(@).message',
        { customFunctions: new CustomFunctions() }
      );

      // Assess
      expect(messages).toStrictEqual(['hello world']);
    });
  });
});
