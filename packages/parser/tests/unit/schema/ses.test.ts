import { describe, expect, it } from 'vitest';
import { SesSchema } from '../../../src/schemas/ses.js';
import type { SesEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: SES', () => {
  const baseEvent = getTestEvent<SesEvent>({
    eventsPath: 'ses',
    filename: 'base',
  });

  it('parses a SES event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = SesSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('keeps the DMARC policy when the message fails DMARC authentication', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    Object.assign(event.Records[0].ses.receipt, {
      dmarcVerdict: { status: 'FAIL' },
      dmarcPolicy: 'reject',
    });

    // Act
    const result = SesSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it.each(['Event', 'RequestResponse'] as const)(
    'parses a Lambda action with the %s invocation type',
    (invocationType) => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].ses.receipt.action.invocationType = invocationType;

      // Act
      const result = SesSchema.parse(event);

      // Assess
      expect(result).toStrictEqual(event);
    }
  );

  it('parses a Lambda action without an invocation type', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    delete event.Records[0].ses.receipt.action.invocationType;

    // Act
    const result = SesSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an email without any of the common headers', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[0].ses.mail.commonHeaders = {};

    // Act
    const result = SesSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not a SES event', () => {
    // Prepare
    const event = {
      Records: [],
    };

    // Act & Assess
    expect(() => SesSchema.parse(event)).toThrow();
  });
});
