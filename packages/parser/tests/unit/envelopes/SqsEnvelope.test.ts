/**
 * Test built in schema
 *
 * @group unit/parser/envelopes/
 */

import { z } from 'zod';
import { generateMock } from '@anatine/zod-mock';
import { SqsRecordSchema } from '../../../src/schemas/sqs.js';
import { SqsEnvelope } from '../../../src/envelopes/SqsEnvelope.js';

describe('SqsEnvelope', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().min(18).max(99),
  });

  it('should parse custom schema in envelope', () => {
    const testCustomSchemaObject = generateMock(schema);
    const mock = generateMock(SqsRecordSchema, {
      stringMap: {
        body: () => JSON.stringify(testCustomSchemaObject),
      },
    });

    const resp = SqsEnvelope.parse({ Records: [mock] }, schema);
    expect(resp).toEqual([testCustomSchemaObject]);
  });

  it('should throw error if invalid schema', () => {
    expect(() => {
      SqsEnvelope.parse({ Records: [{ foo: 'bar' }] }, schema);
    }).toThrow();

    expect(() => {
      SqsEnvelope.parse(
        {
          Records: [
            {
              name: 'foo',
              age: 17,
            },
          ],
        },
        schema
      );
    });
  });
});
