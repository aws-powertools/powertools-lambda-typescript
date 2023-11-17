/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import {
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceUpdateSchema,
  CloudFormationCustomResourceDeleteSchema,
} from '../../../src/schemas/cloudformation-custom-resource';
import { loadExampleEvent } from './utils';

describe('CloudFormationCustomResource ', () => {
  it('should parse create event', () => {
    const cloudFormationCustomResourceCreateEvent = loadExampleEvent(
      'cloudFormationCustomResourceCreateEvent.json'
    );
    expect(
      CloudFormationCustomResourceCreateSchema.parse(
        cloudFormationCustomResourceCreateEvent
      )
    ).toEqual(cloudFormationCustomResourceCreateEvent);
  });
  it('should parse update event', () => {
    const cloudFormationCustomResourceUpdateEvent = loadExampleEvent(
      'cloudFormationCustomResourceUpdateEvent.json'
    );
    expect(
      CloudFormationCustomResourceUpdateSchema.parse(
        cloudFormationCustomResourceUpdateEvent
      )
    ).toEqual(cloudFormationCustomResourceUpdateEvent);
  });
  it('should parse delete event', () => {
    const cloudFormationCustomResourceDeleteEvent = loadExampleEvent(
      'cloudFormationCustomResourceDeleteEvent.json'
    );
    expect(
      CloudFormationCustomResourceDeleteSchema.parse(
        cloudFormationCustomResourceDeleteEvent
      )
    ).toEqual(cloudFormationCustomResourceDeleteEvent);
  });
});
