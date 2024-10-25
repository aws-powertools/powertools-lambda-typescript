/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { SesRecordSchema, SesSchema } from '../../../src/schemas/';
import type { SesEvent } from '../../../src/types';
import type { SesRecord } from '../../../src/types/schema';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

describe('SES', () => {
  it('should parse ses event', () => {
    const sesEvent = TestEvents.sesEvent;
    expect(SesSchema.parse(sesEvent)).toEqual(sesEvent);
  });

  it('should parse record from ses event', () => {
    const sesEvent: SesEvent = TestEvents.sesEvent as SesEvent;
    const parsed: SesRecord = SesRecordSchema.parse(sesEvent.Records[0]);

    expect(parsed.ses.mail.source).toEqual('janedoe@example.com');
  });

  it('should detect missing properties in schema for ses event', () => {
    const sesEvent = TestEvents.sesEvent;
    const strictSchema = makeSchemaStrictForTesting(SesSchema);
    expect(() => strictSchema.parse(sesEvent)).not.toThrow();
  });
});
