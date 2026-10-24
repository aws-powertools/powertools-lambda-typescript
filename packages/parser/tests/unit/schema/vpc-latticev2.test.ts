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

  it('parses the IAM and Roles Anywhere identity fields', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.requestContext.identity = {
      sourceVpcArn:
        'arn:aws:ec2:eu-west-1:123456789012:vpc/vpc-0123456789abcdef0',
      type: 'AWS_IAM',
      principal: 'arn:aws:sts::123456789012:assumed-role/my-role/my-session',
      principalOrgID: 'o-50dc6c495c0c9188',
      sessionName: 'my-session',
      x509IssuerOu: 'IT Department',
      x509SanDns: 'example.com',
      x509SanNameCn: 'example-name',
      x509SanUri: 'https://example.com',
      x509SubjectCn: 'example-subject',
    };

    // Act
    const result = VpcLatticeV2Schema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });
});
