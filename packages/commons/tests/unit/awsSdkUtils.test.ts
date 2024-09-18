import { beforeAll, describe, expect, it, vi } from 'vitest';
import { customUserAgentMiddleware } from '../../src/awsSdkUtils.js';
import {
  addUserAgentMiddleware,
  isSdkClient,
  PT_VERSION as version,
} from '../../src/index.js';

describe('Helpers: awsSdk', () => {
  describe('Function: userAgentMiddleware', () => {
    beforeAll(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => ({}));
    });

    it('handles gracefully failures in adding a middleware and only log a warning', () => {
      // Prepare
      const client = {
        middlewareStack: {
          addRelativeTo: () => {
            throw new Error('test');
          },
        },
      };
      const warningSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => ({}));

      // Act & Assess
      expect(() => addUserAgentMiddleware(client, 'my-feature')).not.toThrow();
      expect(warningSpy).toHaveBeenCalledTimes(1);
    });

    it('should return and do nothing if the client already has a Powertools UA middleware', async () => {
      // Prepare
      const client = {
        middlewareStack: {
          identify: () => [
            'addPowertoolsToUserAgent: after getUserAgentMiddleware',
          ],
          addRelativeTo: vi.fn(),
        },
        send: vi.fn(),
        config: {
          defaultSigningName: 'bar',
        },
      };
      const feature = 'my-feature';

      // Act
      addUserAgentMiddleware(client, feature);

      // Assess
      expect(client.middlewareStack.addRelativeTo).toHaveBeenCalledTimes(0);
    });

    it('should call the function to add the middleware with the correct arguments', async () => {
      // Prepare
      const client = {
        middlewareStack: {
          identify: () => '',
          addRelativeTo: vi.fn(),
        },
        send: vi.fn(),
        config: {
          defaultSigningName: 'bar',
        },
      };
      const feature = 'my-feature';

      // Act
      addUserAgentMiddleware(client, feature);

      // Assess
      expect(client.middlewareStack.addRelativeTo).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        {
          relation: 'after',
          toMiddleware: 'getUserAgentMiddleware',
          name: 'addPowertoolsToUserAgent',
          tags: ['POWERTOOLS', 'USER_AGENT'],
        }
      );
    });
  });

  describe('Function: customUserAgentMiddleware', () => {
    it('returns a middleware function', () => {
      // Prepare
      const feature = 'my-feature';

      // Act
      const middleware = customUserAgentMiddleware(feature);

      // Assess
      expect(middleware).toBeInstanceOf(Function);
    });

    it('adds the Powertools UA to the request headers', async () => {
      // Prepare
      const feature = 'my-feature';
      const middleware = customUserAgentMiddleware(feature);
      const next = vi.fn();
      const args = {
        request: {
          headers: {
            'user-agent': 'foo',
          },
        },
      };

      // Act
      await middleware(next)(args);

      // Assess
      expect(args.request.headers['user-agent']).toEqual(
        `foo PT/my-feature/${version} PTEnv/NA`
      );
    });
  });

  describe('Function: isSdkClient', () => {
    it('returns true if the client is a valid AWS SDK v3 client', () => {
      // Prepare
      const client = {
        send: vi.fn(),
        config: {
          defaultSigningName: 'bar',
        },
        middlewareStack: {
          identify: () => '',
          addRelativeTo: vi.fn(),
        },
      };

      // Act
      const result = isSdkClient(client);

      // Assess
      expect(result).toEqual(true);
    });

    it('returns false if the client is not a valid AWS SDK v3 client', () => {
      // Prepare
      const client = {};

      // Act
      const result = isSdkClient(client);

      // Assess
      expect(result).toEqual(false);
    });
  });
});
