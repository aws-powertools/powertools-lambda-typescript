import { describe, expect, it } from 'vitest';
import {
  UnmarshallDynamoDBAttributeError,
  unmarshallDynamoDB,
} from '../../src/unmarshallDynamoDB.js';

describe('Function: unmarshallDynamoDB', () => {
  it('unmarshalls a DynamoDB string attribute', () => {
    // Prepare
    const value = { Message: { S: 'test string' } };

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({ Message: 'test string' });
  });

  it('unmarshalls a DynamoDB number attribute', () => {
    // Prepare
    const value = { Id: { N: '123' } };

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({ Id: 123 });
  });

  it('unmarshalls a DynamoDB boolean attribute', () => {
    // Prepare
    const value = { Message: { BOOL: true } };

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({ Message: true });
  });

  it('unmarshalls a DynamoDB null attribute', () => {
    // Prepare
    const value = { Message: { NULL: true } };

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({ Message: null });
  });

  it('unmarshalls a DynamoDB list attribute', () => {
    // Prepare
    const value = {
      Messages: {
        L: [{ S: 'string' }, { N: '123' }, { BOOL: true }, { NULL: true }],
      },
    };

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({ Messages: ['string', 123, true, null] });
  });

  it('unmarshalls a DynamoDB map attribute', () => {
    // Prepare
    const value = {
      Settings: {
        M: {
          string: { S: 'test' },
          number: { N: '123' },
          boolean: { BOOL: true },
          null: { NULL: true },
        },
      },
    };

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({
      Settings: {
        string: 'test',
        number: 123,
        boolean: true,
        null: null,
      },
    });
  });

  it('unmarshalls a DynamoDB string set attribute', () => {
    // Prepare
    const value = { Messages: { SS: ['a', 'b', 'c'] } };

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({ Messages: new Set(['a', 'b', 'c']) });
  });

  it('unmarshalls a DynamoDB number set attribute', () => {
    // Prepare
    const value = { Ids: { NS: ['1', '2', '3'] } };

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({ Ids: new Set([1, 2, 3]) });
  });

  it('unmarshalls nested DynamoDB structures', () => {
    // Prepare
    const value = {
      Messages: {
        M: {
          nested: {
            M: {
              list: {
                L: [
                  { S: 'string' },
                  {
                    M: {
                      key: { S: 'value' },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    };

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({
      Messages: {
        nested: {
          list: ['string', { key: 'value' }],
        },
      },
    });
  });

  it('throws if an unsupported type is passed', () => {
    // Prepare
    const value = { Message: { NNN: '123' } };

    // Act & Assess
    // @ts-expect-error - Intentionally invalid value
    expect(() => unmarshallDynamoDB(value)).toThrow(
      UnmarshallDynamoDBAttributeError
    );
  });

  it('unmarshalls a DynamoDB large number attribute to BigInt', () => {
    // Prepare
    const value = { Balance: { N: '9007199254740992' } }; // Number.MAX_SAFE_INTEGER + 1

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({ Balance: BigInt('9007199254740992') });
  });

  it('unmarshalls a DynamoDB negative large number attribute to BigInt', () => {
    // Prepare
    const value = { Balance: { N: '-9007199254740992' } }; // Number.MIN_SAFE_INTEGER - 1

    // Act
    const result = unmarshallDynamoDB(value);

    // Assess
    expect(result).toStrictEqual({ Balance: BigInt('-9007199254740992') });
  });

  it('throws when trying to convert an invalid number string to BigInt', () => {
    // Prepare
    const value = { Balance: { N: '9007199254740992.5' } }; // Invalid BigInt string (decimals not allowed)

    // Act & Assess
    expect(() => unmarshallDynamoDB(value)).toThrow(
      new UnmarshallDynamoDBAttributeError(
        "9007199254740992.5 can't be converted to BigInt"
      )
    );
  });

  it('throws when no data is found', () => {
    // Prepare
    const value = undefined;

    // Act & Assess
    // @ts-expect-error - Intentionally invalid value
    expect(() => unmarshallDynamoDB(value)).toThrow(
      UnmarshallDynamoDBAttributeError
    );
  });
});
