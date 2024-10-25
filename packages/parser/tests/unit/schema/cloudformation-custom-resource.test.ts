/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import {
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceDeleteSchema,
  CloudFormationCustomResourceUpdateSchema,
} from '../../../src/schemas/';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

describe('CloudFormationCustomResource ', () => {
  it('should parse create event', () => {
    const cloudFormationCustomResourceCreateEvent =
      TestEvents.cloudFormationCustomResourceCreateEvent;

    expect(
      CloudFormationCustomResourceCreateSchema.parse(
        cloudFormationCustomResourceCreateEvent
      )
    ).toEqual(cloudFormationCustomResourceCreateEvent);
  });
  it('should parse update event', () => {
    const cloudFormationCustomResourceUpdateEvent =
      TestEvents.cloudFormationCustomResourceUpdateEvent;

    expect(
      CloudFormationCustomResourceUpdateSchema.parse(
        cloudFormationCustomResourceUpdateEvent
      )
    ).toEqual(cloudFormationCustomResourceUpdateEvent);
  });
  it('should parse delete event', () => {
    const cloudFormationCustomResourceDeleteEvent =
      TestEvents.cloudFormationCustomResourceDeleteEvent;

    expect(
      CloudFormationCustomResourceDeleteSchema.parse(
        cloudFormationCustomResourceDeleteEvent
      )
    ).toEqual(cloudFormationCustomResourceDeleteEvent);
  });

  describe('should detect missing properties in schema for ', () => {
    it('CloudFormationCustomResourceCreateSchema', () => {
      const cloudFormationCustomResourceCreateEvent =
        TestEvents.cloudFormationCustomResourceCreateEvent;

      const strictSchema = makeSchemaStrictForTesting(
        CloudFormationCustomResourceCreateSchema
      );

      expect(() =>
        strictSchema.parse(cloudFormationCustomResourceCreateEvent)
      ).not.toThrow();
    });

    it('CloudFormationCustomResourceUpdateSchema', () => {
      const cloudFormationCustomResourceUpdateEvent =
        TestEvents.cloudFormationCustomResourceUpdateEvent;

      const strictSchema = makeSchemaStrictForTesting(
        CloudFormationCustomResourceUpdateSchema
      );

      expect(() =>
        strictSchema.parse(cloudFormationCustomResourceUpdateEvent)
      ).not.toThrow();
    });

    it('CloudFormationCustomResourceDeleteSchema', () => {
      const cloudFormationCustomResourceDeleteEvent =
        TestEvents.cloudFormationCustomResourceDeleteEvent;

      const strictSchema = makeSchemaStrictForTesting(
        CloudFormationCustomResourceDeleteSchema
      );

      expect(() =>
        strictSchema.parse(cloudFormationCustomResourceDeleteEvent)
      ).not.toThrow();
    });
  });
});
