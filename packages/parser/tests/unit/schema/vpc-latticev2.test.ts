import { describe, expect, it } from 'vitest';
import { VpcLatticeV2Schema } from '../../../src/schemas/vpc-latticev2.js';
import type { VpcLatticeEventV2 } from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Schema: VPC Lattice v2', () => {
  const baseEvent = getTestEvent<VpcLatticeEventV2>({
    eventsPath: 'vpc-lattice-v2',
    filename: 'base',
  });

  it('throws when the event is invalid', () => {
    // Prepare
    const event = omit(['version', 'path'], structuredClone(baseEvent));

    // Act & Assess
    expect(() => VpcLatticeV2Schema.parse(event)).toThrow();
  });

  it('parses a VPC Lattice v2 event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = VpcLatticeV2Schema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('preserves all documented VPC Lattice v2 identity fields', () => {
    // Prepare
    const identity = {
      sourceVpcArn:
        'arn:aws:ec2:eu-west-1:123456789012:vpc/vpc-0123456789abcdef0',
      type: 'AWS_IAM',
      principal: 'arn:aws:sts::123456789012:assumed-role/example/session',
      principalOrgID: 'o-example',
      sessionName: 'session',
      x509IssuerOu: 'Example Department',
      x509SanDns: 'example.com',
      x509SanNameCn: 'example-name',
      x509SanUri: 'https://example.com',
      x509SubjectCn: 'example-subject',
    };
    const event = {
      ...structuredClone(baseEvent),
      requestContext: {
        ...baseEvent.requestContext,
        identity,
      },
    };

    // Act
    const result = VpcLatticeV2Schema.parse(event);

    // Assess
    expect(result.requestContext.identity).toStrictEqual(identity);
  });

  it('parses an identity without optional fields', () => {
    // Prepare
    const event = {
      ...structuredClone(baseEvent),
      requestContext: {
        ...baseEvent.requestContext,
        identity: {},
      },
    };

    // Act
    const result = VpcLatticeV2Schema.parse(event);

    // Assess
    expect(result.requestContext.identity).toStrictEqual({});
  });

  it.each(['principalOrgID', 'x509SubjectCn', 'x509IssuerOu', 'x509SanNameCn'])(
    'rejects a non-string value for identity.%s',
    (field) => {
      // Prepare
      const event = {
        ...structuredClone(baseEvent),
        requestContext: {
          ...baseEvent.requestContext,
          identity: { [field]: 123 },
        },
      };

      // Act
      const result = VpcLatticeV2Schema.safeParse(event);

      // Assess
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'invalid_type',
            path: ['requestContext', 'identity', field],
          }),
        ])
      );
    }
  );
});
