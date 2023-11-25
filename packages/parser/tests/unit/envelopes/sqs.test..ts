/**
 * Test built in schema
 *
 * @group unit/parser/envelopes/
 */

import { z } from 'zod';
import { generateMock } from '@anatine/zod-mock';
import { SqsRecordSchema } from '../../../src/schemas/sqs.js';
import { Envelopes } from '../../../src/envelopes/Envelope.js';

describe('SqsEnvelope ', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().min(18).max(99),
  });

  const envelope = Envelopes.SQS_ENVELOPE;

  it('should parse custom schema in envelope', () => {
    const testCustomSchemaObject = generateMock(schema);
    const mock = generateMock(SqsRecordSchema, {
      stringMap: {
        body: () => JSON.stringify(testCustomSchemaObject),
      },
    });

    const resp = envelope.parse({ Records: [mock] }, schema);
    expect(resp).toEqual([testCustomSchemaObject]);
  });

  it('should throw error if invalid schema', () => {
    expect(() => {
      envelope.parse({ Records: [{ foo: 'bar' }] }, schema);
    }).toThrow();

    expect(() => {
      envelope.parse(
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
