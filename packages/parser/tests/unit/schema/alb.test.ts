/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import {
  AlbSchema,
  AlbMultiValueHeadersSchema,
} from '../../../src/schemas/alb';
import albEvent from '../../events/albEvent.json';
import albEventPathTrailingSlash from '../../events/albEventPathTrailingSlash.json';
import albMultiValueHeadersEvent from '../../events/albMultiValueHeadersEvent.json';

describe('ALB ', () => {
  it('should parse alb event', () => {
    AlbSchema.parse(albEvent);
  });
  it('should parse alb event path trailing slash', () => {
    AlbSchema.parse(albEventPathTrailingSlash);
  });
  it('should parse alb event with multi value headers event', () => {
    AlbMultiValueHeadersSchema.parse(albMultiValueHeadersEvent);
  });
});
