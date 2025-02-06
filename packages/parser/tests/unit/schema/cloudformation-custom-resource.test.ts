import { describe, expect, it } from 'vitest';
import {
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceDeleteSchema,
  CloudFormationCustomResourceUpdateSchema,
} from '../../../src/schemas/cloudformation-custom-resource.js';
import type {
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceDeleteEvent,
  CloudFormationCustomResourceUpdateEvent,
} from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Schema: CloudFormationCustomResource ', () => {
  const eventsPath = 'cloudformation';
  const baseCreate = getTestEvent<CloudFormationCustomResourceCreateEvent>({
    eventsPath,
    filename: 'custom-resource-create',
  });
  const baseDelete = getTestEvent<CloudFormationCustomResourceDeleteEvent>({
    eventsPath,
    filename: 'custom-resource-delete',
  });
  const baseUpdate = getTestEvent<CloudFormationCustomResourceUpdateEvent>({
    eventsPath,
    filename: 'custom-resource-update',
  });

  it('parses a CloudFormation Custom Resource Create event', () => {
    // Prepare
    const event = structuredClone(baseCreate);

    // Act
    const result = CloudFormationCustomResourceCreateSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not a CloudFormation Custom Resource Create event', () => {
    // Prepare
    const event = omit(['RequestType'], structuredClone(baseCreate));

    // Act & Assess
    expect(() =>
      CloudFormationCustomResourceCreateSchema.parse(event)
    ).toThrow();
  });

  it('parses a CloudFormation Custom Resource Delete event', () => {
    // Prepare
    const event = structuredClone(baseDelete);

    // Act
    const result = CloudFormationCustomResourceDeleteSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not a CloudFormation Custom Resource Delete event', () => {
    // Prepare
    const event = omit(['LogicalResourceId'], structuredClone(baseDelete));

    // Act & Assess
    expect(() =>
      CloudFormationCustomResourceDeleteSchema.parse(event)
    ).toThrow();
  });

  it('parses a CloudFormation Custom Resource Update event', () => {
    // Prepare
    const event = structuredClone(baseUpdate);

    // Act
    const result = CloudFormationCustomResourceUpdateSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not a CloudFormation Custom Resource Update event', () => {
    // Prepare
    const event = omit(['OldResourceProperties'], structuredClone(baseUpdate));

    // Act & Assess
    expect(() =>
      CloudFormationCustomResourceUpdateSchema.parse(event)
    ).toThrow();
  });
});
