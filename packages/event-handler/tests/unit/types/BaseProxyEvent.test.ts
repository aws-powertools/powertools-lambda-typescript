/**
 * Test Logger class
 *
 * @group unit/event-handler/types/all
 */

import { BaseAPIGatewayProxyEvent } from '../../../src/types';

describe('Class: BaseProxyEvent', () => {
  describe('Feature: HTTPProxyEvent', () => {
    test('should be able to cast APIGatewayProxyEvent to base event', () => {
      const event = {
        resource: '/v1/multi/one',
        httpMethod: 'GET',
        path: '/v1/multi/one',
        body: 'null',
        headers: {
          'test-header': 'test-value',
        },
        isBase64Encoded: false,
        multiValueHeaders: {},
        pathParameters: null,
        stageVariables: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as BaseAPIGatewayProxyEvent;
      expect(event).toBeDefined();
    });
  });
});
