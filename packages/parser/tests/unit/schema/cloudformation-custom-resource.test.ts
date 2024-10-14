import { describe, expect, it } from 'vitest';
import {
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceDeleteSchema,
  CloudFormationCustomResourceUpdateSchema,
} from '../../../src/schemas/cloudformation-custom-resource.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: CloudFormationCustomResources', () => {
  const eventsPath = 'cloudformation';

  it('parses a CloudFormation create event', () => {
    // Prepare
    const event = getTestEvent({
      eventsPath,
      filename: 'create',
    });

    // Act
    const parsedEvent = CloudFormationCustomResourceCreateSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('parses a CloudFormation delete event', () => {
    // Prepare
    const event = getTestEvent({
      eventsPath,
      filename: 'delete',
    });

    // Act
    const parsedEvent = CloudFormationCustomResourceDeleteSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it('parses a CloudFormation update event', () => {
    // Prepare
    const event = getTestEvent({
      eventsPath,
      filename: 'update',
    });

    // Act
    const parsedEvent = CloudFormationCustomResourceUpdateSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
  });

  it.each([
    { schema: CloudFormationCustomResourceCreateSchema, name: 'create' },
    { schema: CloudFormationCustomResourceDeleteSchema, name: 'delete' },
    { schema: CloudFormationCustomResourceUpdateSchema, name: 'update' },
  ])('throws when the event is invalid ($name)', ({ schema }) => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => schema.parse(event)).toThrow();
  });
});
