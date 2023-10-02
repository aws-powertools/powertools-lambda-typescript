/**
 * Test Logger class
 *
 * @group unit/event-handler/types/all
 */

import { CORSConfig } from '../../../src/types/CorsConfig';

describe('Class: CORSConfig', () => {
  describe('Feature: CORS Config - Headers', () => {
    test('should add Access-Control-Allow-Origin: * if allow origin is not configured', () => {
      const corsHeaders = new CORSConfig().headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Origin']).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Origin']).toEqual('*');
    });

    test('should add Access-Control-Allow-Origin with origins if allow origin is configured', () => {
      const allowOrigin = 'xyz.domain.com, abc.domain.com';
      const corsHeaders = new CORSConfig(allowOrigin).headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Origin']).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Origin']).toEqual(allowOrigin);
    });

    test('should add default Access-Control-Allow-Headers if allow headers is not configured', () => {
      const defaultAllowHeaders =
        'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token';
      const corsHeaders = new CORSConfig().headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Headers']).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Headers']).toEqual(
        defaultAllowHeaders
      );
    });

    test('should include Access-Control-Allow-Headers with default allow headers if allow headers is configured', () => {
      const defaultAllowHeaders =
        'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token';
      const additionalAllowHeaders = 'test-header,mock-header';
      const additionalAllowHeadersSet = additionalAllowHeaders.split(',');

      const corsHeaders = new CORSConfig(
        '*',
        additionalAllowHeadersSet
      ).headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Headers']).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Headers']).toEqual(
        defaultAllowHeaders + ',' + additionalAllowHeaders
      );
    });

    test('should include Access-Control-Allow-Headers as only "*" if allow headers includes "*"', () => {
      const additionalAllowHeaders = '*,test-header,mock-header';
      const additionalAllowHeadersSet = additionalAllowHeaders.split(',');
      const corsHeaders = new CORSConfig(
        '*',
        additionalAllowHeadersSet
      ).headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Headers']).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Headers']).toEqual('*');
    });

    test('should not include Access-Control-Expose-Headers if expose headers is not configured', () => {
      const corsHeaders = new CORSConfig().headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Expose-Headers']).toBeUndefined();
    });

    test('should include Access-Control-Expose-Headers if expose headers is configured', () => {
      const exposeHeaders = 'test_header, mock_header';
      const exposeHeadersSet = exposeHeaders.split(',');
      const corsHeaders = new CORSConfig('*', [], exposeHeadersSet).headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Expose-Headers']).toBeDefined();
      expect(corsHeaders['Access-Control-Expose-Headers']).toEqual(
        exposeHeaders
      );
    });

    test('should not include Access-Control-Max-Age if Max Age is not configured', () => {
      const corsHeaders = new CORSConfig().headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Max-Age']).toBeUndefined();
    });

    test('should include Access-Control-Max-Age if Max Age is configured', () => {
      const maxAge = 5;
      const corsHeaders = new CORSConfig('*', [], [], maxAge).headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Max-Age']).toBeDefined();
      expect(corsHeaders['Access-Control-Max-Age']).toEqual(maxAge.toString());
    });

    test('should not include Access-Control-Allow-Credentials if allow credentials is not configured', () => {
      const corsHeaders = new CORSConfig().headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Credentials']).toBeUndefined();
    });

    test('should include Access-Control-Allow-Credentials if allow credentials is configured', () => {
      const corsHeaders = new CORSConfig('*', [], [], 0, true).headers();
      expect(corsHeaders).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Credentials']).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Credentials']).toEqual('true');
    });
  });
});
