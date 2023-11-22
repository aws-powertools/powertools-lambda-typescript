/**
 * Test built in schema
 *
 * @group unit/parser/envelopes/
 */

import { z } from 'zod';
import { generateMock } from '@anatine/zod-mock';
import { SqsRecordSchema } from '../../../src/schemas/sqs.js';
import { SqsEnvelope } from '../../../src/envelopes/sqs.js';

describe('SQS', () => {
  it('should parse custom schema in envelope', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().min(18).max(99),
    });

    const testCustomSchemaObject = generateMock(schema);
    const mock = generateMock(SqsRecordSchema, {
      stringMap: {
        body: () => JSON.stringify(testCustomSchemaObject),
      },
    });

    const resp = new SqsEnvelope().parse({ Records: [mock] }, schema);
    expect(resp).toEqual([testCustomSchemaObject]);
  });
});
