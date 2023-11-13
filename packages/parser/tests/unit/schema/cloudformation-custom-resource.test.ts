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
    CloudFormationCustomResourceCreateSchema.parse(
      cloudFormationCustomResourceCreateEvent
    );
  });
  it('should parse update event', () => {
    CloudFormationCustomResourceUpdateSchema.parse(
      cloudFormationCustomResourceUpdateEvent
    );
  });
  it('should parse delete event', () => {
    CloudFormationCustomResourceDeleteSchema.parse(
      cloudFormationCustomResourceDeleteEvent
    );
  });
});
