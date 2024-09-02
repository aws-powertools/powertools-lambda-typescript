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
import { TestEvents } from './utils.js';

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
});
