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
import cloudFormationCustomResourceCreateEvent from '../../events/cloudformationCustomResourceCreate.json';
import cloudFormationCustomResourceUpdateEvent from '../../events/cloudformationCustomResourceUpdate.json';
import cloudFormationCustomResourceDeleteEvent from '../../events/cloudformationCustomResourceDelete.json';

describe('CloudFormationCustomResource ', () => {
  it('should parse create event', () => {
    console.log(CloudFormationCustomResourceCreateSchema.shape);
    expect(
      CloudFormationCustomResourceCreateSchema.parse(
        cloudFormationCustomResourceCreateEvent
      )
    ).toEqual(cloudFormationCustomResourceCreateEvent);
  });
  it('should parse update event', () => {
    expect(
      CloudFormationCustomResourceUpdateSchema.parse(
        cloudFormationCustomResourceUpdateEvent
      )
    ).toEqual(cloudFormationCustomResourceUpdateEvent);
  });
  it('should parse delete event', () => {
    expect(
      CloudFormationCustomResourceDeleteSchema.parse(
        cloudFormationCustomResourceDeleteEvent
      )
    ).toEqual(cloudFormationCustomResourceDeleteEvent);
  });
});
