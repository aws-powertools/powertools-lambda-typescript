import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';
import {
  GetParameterCommand,
  GetParametersByPathCommand,
  GetParametersCommand,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import type { GetParametersCommandOutput } from '@aws-sdk/client-ssm';
import { toBase64 } from '@smithy/util-base64';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpirableValue } from '../../src/base/ExpirableValue.js';
import { SSMProvider } from '../../src/ssm/index.js';
import type {
  SSMGetParametersByNameFromCacheOutputType,
  SSMGetParametersByNameOptions,
  SSMGetParametersByNameOutputInterface,
  SSMProviderOptions,
  SSMSetOptions,
  SSMSplitBatchAndDecryptParametersOutputType,
} from '../../src/types/SSMProvider.js';

const encoder = new TextEncoder();
vi.mock('@aws-lambda-powertools/commons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-lambda-powertools/commons')>()),
  addUserAgentMiddleware: vi.fn(),
}));

describe('Class: SSMProvider', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  describe('Method: constructor', () => {
    it('adds the middleware to the created AWS SDK', async () => {
      // Prepare
      const options: SSMProviderOptions = {};

      // Act
      const provider = new SSMProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'SSM',
        })
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });

    it('creates a new AWS SDK using the provided client config', async () => {
      // Prepare
      const options: SSMProviderOptions = {
        clientConfig: {
          region: 'eu-south-2',
        },
      };

      // Act
      const provider = new SSMProvider(options);

      // Assess
      expect(provider.client.config.region()).resolves.toEqual('eu-south-2');
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });

    it('uses the provided AWS SDK client', async () => {
      // Prepare
      const awsSdkV3Client = new SSMClient({
        endpoint: 'http://localhost:3000',
        serviceId: 'Foo',
      });

      const options: SSMProviderOptions = {
        awsSdkV3Client: awsSdkV3Client,
      };

      // Act
      const provider = new SSMProvider(options);

      // Assess
      expect(provider.client).toEqual(awsSdkV3Client);
      expect(addUserAgentMiddleware).toHaveBeenCalledWith(
        awsSdkV3Client,
        'parameters'
      );
    });

    it('falls back on a new SDK client and logs a warning when an unknown object is provided instead of a client', async () => {
      // Prepare
      const awsSdkV3Client = {};
      const options: SSMProviderOptions = {
        awsSdkV3Client: awsSdkV3Client as SSMClient,
      };
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      // Act
      const provider = new SSMProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'SSM',
        })
      );
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        1,
        'awsSdkV3Client is not an AWS SDK v3 client, using default client'
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });
  });

  describe('Method: getParametersByName', () => {
    class SSMProviderMock extends SSMProvider {
      public getParametersBatchByName = vi.fn();
      public getParametersByNameWithDecryptOption = vi.fn();
    }

    it('calls both getParametersByNameWithDecryptOption and getParametersBatchByName when called with no parameters to decrypt', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters: Record<string, SSMGetParametersByNameOptions> = {
        '/foo/bar': {
          maxAge: 1000,
        },
        '/foo/baz': {
          transform: 'json',
        },
      };
      provider.getParametersByNameWithDecryptOption.mockResolvedValue({
        response: {},
        errors: [],
      });
      provider.getParametersBatchByName.mockResolvedValue({
        response: {
          '/foo/bar': 'bar',
          '/foo/baz': 'baz',
        },
        errors: [],
      });

      // Act
      await provider.getParametersByName(parameters, { decrypt: false });

      // Assess
      // throwOnTransformError is true by default
      expect(
        provider.getParametersByNameWithDecryptOption
      ).toHaveBeenCalledWith({}, true);
      expect(provider.getParametersBatchByName).toHaveBeenCalledWith(
        parameters,
        true,
        false
      );
      expect(provider.getParametersBatchByName).toHaveBeenCalledTimes(1);
    });

    it('calls only getParametersBatchByName when called with all parameters to decrypt', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters: Record<string, SSMGetParametersByNameOptions> = {
        '/foo/bar': {
          maxAge: 1000,
        },
        '/foo/baz': {
          transform: 'json',
        },
      };
      provider.getParametersBatchByName.mockResolvedValue({
        response: {
          '/foo/bar': 'bar',
          '/foo/baz': 'baz',
        },
        errors: [],
      });

      // Act
      await provider.getParametersByName(parameters, { decrypt: true });

      // Assess
      expect(provider.getParametersBatchByName).toHaveBeenCalledWith(
        parameters,
        true,
        true
      );
      expect(provider.getParametersBatchByName).toHaveBeenCalledTimes(1);
      expect(
        provider.getParametersByNameWithDecryptOption
      ).not.toHaveBeenCalled();
    });

    it('calls both getParametersByNameWithDecryptOption and getParametersBatchByName when called with some parameters to decrypt', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters: Record<string, SSMGetParametersByNameOptions> = {
        '/foo/bar': {
          maxAge: 1000,
        },
        '/foo/baz': {
          transform: 'json',
          decrypt: true,
        },
      };
      provider.getParametersByNameWithDecryptOption.mockResolvedValue({
        response: {
          '/foo/baz': 'baz',
        },
        errors: [],
      });
      provider.getParametersBatchByName.mockResolvedValue({
        response: {
          '/foo/bar': 'bar',
        },
        errors: [],
      });

      // Act
      await provider.getParametersByName(parameters, {});

      // Assess
      // throwOnError is true by default
      expect(
        provider.getParametersByNameWithDecryptOption
      ).toHaveBeenCalledWith(
        {
          '/foo/baz': {
            transform: 'json',
            decrypt: true,
            maxAge: 5,
          },
        },
        true
      );
      expect(provider.getParametersBatchByName).toHaveBeenCalledWith(
        {
          '/foo/bar': {
            maxAge: 1000,
            decrypt: false,
            transform: undefined,
          },
        },
        true,
        false
      );
      expect(
        provider.getParametersByNameWithDecryptOption
      ).toHaveBeenCalledTimes(1);
      expect(provider.getParametersBatchByName).toHaveBeenCalledTimes(1);
    });

    it('handles the error and returns it when getParametersBatchByName throws and throwOnError is false', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters: Record<string, SSMGetParametersByNameOptions> = {
        '/foo/bar': {
          maxAge: 1000,
        },
        '/foo/baz': {
          transform: 'json',
        },
      };
      provider.getParametersByNameWithDecryptOption.mockResolvedValue({
        response: {},
        errors: [],
      });
      provider.getParametersBatchByName.mockResolvedValue({
        response: {
          '/foo/baz': 'baz',
        },
        errors: ['/foo/bar'],
      });

      // Act
      const result = await provider.getParametersByName(parameters, {
        decrypt: false,
        throwOnError: false,
      });

      // Assess
      expect(result).toEqual({
        '/foo/baz': 'baz',
        _errors: ['/foo/bar'],
      });
    });

    it('handles the error and returns it when getParametersBatchByName throws and throwOnError is false', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters: Record<string, SSMGetParametersByNameOptions> = {
        '/foo/bar': {
          maxAge: 1000,
        },
        '/foo/baz': {
          transform: 'json',
        },
      };
      provider.getParametersBatchByName.mockResolvedValue({
        response: {},
        errors: ['/foo/bar', '/foo/baz'],
      });

      // Act
      const result = await provider.getParametersByName(parameters, {
        decrypt: true,
        throwOnError: false,
      });

      // Assess
      expect(result).toEqual({
        _errors: ['/foo/bar', '/foo/baz'],
      });
    });
  });

  describe('Method: _get', () => {
    it('decrypts the parameter when configured via env variable', async () => {
      // Prepare
      process.env.POWERTOOLS_PARAMETERS_SSM_DECRYPT = 'true';
      const provider = new SSMProvider();
      const parameterName = 'foo';
      const parameterValue = 'foo';
      const client = mockClient(SSMClient)
        .on(GetParameterCommand)
        .resolves({
          Parameter: {
            Value: parameterValue,
          },
        });

      // Act
      const value = await provider.get(parameterName);

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName,
        WithDecryption: true,
      });
      expect(value).toBe(parameterValue);
    });

    it('gets the parameter using default config', async () => {
      // Prepare
      const provider = new SSMProvider();
      const parameterName = 'foo';
      const parameterValue = 'foo';
      const client = mockClient(SSMClient)
        .on(GetParameterCommand)
        .resolves({
          Parameter: {
            Value: parameterValue,
          },
        });

      // Act
      const value = await provider.get(parameterName);

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName,
      });
      expect(value).toBe(parameterValue);
    });

    it('uses the provided sdkOptions when getting a paramter', async () => {
      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParameterCommand).resolves({});
      const parameterName = 'foo';

      // Act
      await provider.get(parameterName, {
        sdkOptions: { WithDecryption: true },
      });

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName,
        WithDecryption: true,
      });
    });

    it('decrypts the parameter when enabling decrypt', async () => {
      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient).on(GetParameterCommand).resolves({});
      const parameterName = 'foo';

      // Act
      await provider.get(parameterName, { decrypt: true });

      // Assess
      expect(client).toReceiveCommandWith(GetParameterCommand, {
        Name: parameterName,
        WithDecryption: true,
      });
    });
  });

  describe('Method: _getMultiple', () => {
    it('uses the provided path and passes it to the underlying sdk', async () => {
      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient)
        .on(GetParametersByPathCommand)
        .resolves({});
      const parameterPath = '/foo';

      // Act
      await provider.getMultiple(parameterPath);

      // Assess
      expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
        Path: parameterPath,
      });
    });

    it('passes down the provided sdkOptions to the underlying SDK', async () => {
      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient)
        .on(GetParametersByPathCommand)
        .resolves({
          Parameters: [],
        });
      const parameterPath = '/foo';

      // Act
      await provider.getMultiple(parameterPath, {
        sdkOptions: { MaxResults: 10 },
      });

      // Assess
      expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
        Path: parameterPath,
        MaxResults: 10,
      });
    });

    it('uses the default options when no options are provided', async () => {
      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient)
        .on(GetParametersByPathCommand)
        .resolves({
          Parameters: [],
        });
      const parameterPath = '/foo';

      // Act
      await provider.getMultiple(parameterPath);

      // Assess
      expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
        Path: parameterPath,
      });
    });

    it('uses the provided config when recursive or decrypt are enabled', async () => {
      // Prepare
      const provider = new SSMProvider();
      const client = mockClient(SSMClient)
        .on(GetParametersByPathCommand)
        .resolves({
          Parameters: [],
        });
      const parameterPath = '/foo';

      // Act
      await provider.getMultiple(parameterPath, {
        recursive: false,
        decrypt: true,
      });

      // Assess
      expect(client).toReceiveCommandWith(GetParametersByPathCommand, {
        Path: parameterPath,
        Recursive: false,
        WithDecryption: true,
      });
    });

    it('returns an object with the names when multiple parameters that share the same path as suffix are retrieved', async () => {
      // Prepare
      const provider = new SSMProvider();
      mockClient(SSMClient)
        .on(GetParametersByPathCommand)
        .resolves({
          Parameters: [
            {
              Name: '/foo/bar',
              Value: 'bar',
            },
            {
              Name: '/foo/baz',
              Value: 'baz',
            },
          ],
        });
      const parameterPath = '/foo';

      // Act
      const parameters = await provider.getMultiple(parameterPath);

      // Assess
      expect(parameters).toEqual({
        bar: 'bar',
        baz: 'baz',
      });
    });

    it('scrolls through the pages and aggregates the results when when multiple pages are found', async () => {
      // Prepare
      const provider = new SSMProvider();
      mockClient(SSMClient)
        .on(GetParametersByPathCommand)
        .resolvesOnce({
          Parameters: [
            {
              Name: '/foo/bar',
              Value: 'bar',
            },
          ],
          NextToken: 'someToken',
        })
        .resolves({
          Parameters: [
            {
              Name: '/foo/baz',
              Value: 'baz',
            },
          ],
        });
      const parameterPath = '/foo';

      // Act
      const parameters = await provider.getMultiple(parameterPath);

      // Assess
      expect(parameters).toEqual({
        bar: 'bar',
        baz: 'baz',
      });
    });
  });

  describe('Method: _getParametersByName', () => {
    class SSMProviderMock extends SSMProvider {
      public transformAndCacheGetParametersResponse = vi.fn();

      public _getParametersByName(
        parameters: Record<string, SSMGetParametersByNameOptions>,
        throwOnError: boolean,
        decrypt: boolean
      ): Promise<SSMGetParametersByNameOutputInterface> {
        return super._getParametersByName(parameters, throwOnError, decrypt);
      }
    }

    it('passes down the config when called with a list of parameters', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const client = mockClient(SSMClient)
        .on(GetParametersCommand)
        .resolves({
          Parameters: [
            {
              Name: '/foo/bar',
              Value: 'bar',
            },
            {
              Name: '/foo/baz',
              Value: 'baz',
            },
          ],
          InvalidParameters: [],
        });
      const parameters = {
        '/foo/bar': {
          throwOnError: true,
          decrypt: true,
        },
        '/foo/baz': {
          throwOnError: false,
          decrypt: false,
        },
      };
      provider.transformAndCacheGetParametersResponse.mockReturnValue({
        '/foo/bar': 'bar',
        '/foo/baz': 'baz',
      });

      // Act
      const results = await provider._getParametersByName(
        parameters,
        true,
        true
      );

      // Assess
      expect(results).toEqual({
        response: {
          '/foo/bar': 'bar',
          '/foo/baz': 'baz',
        },
        errors: [],
      });
      expect(client).toReceiveCommandWith(GetParametersCommand, {
        Names: ['/foo/bar', '/foo/baz'],
        WithDecryption: true,
      });
      expect(
        provider.transformAndCacheGetParametersResponse
      ).toHaveBeenCalledWith(
        {
          Parameters: [
            {
              Name: '/foo/bar',
              Value: 'bar',
            },
            {
              Name: '/foo/baz',
              Value: 'baz',
            },
          ],
          InvalidParameters: [],
        },
        parameters,
        true
      );
    });
  });

  describe('Method: getParametersBatchByName', () => {
    class SSMProviderMock extends SSMProvider {
      public getParametersByNameFromCache = vi.fn();
      public getParametersByNameInChunks = vi.fn();

      public getParametersBatchByName(
        parameters: Record<string, SSMGetParametersByNameOptions>,
        throwOnError: boolean,
        decrypt: boolean
      ): Promise<SSMGetParametersByNameOutputInterface> {
        return super.getParametersBatchByName(
          parameters,
          throwOnError,
          decrypt
        );
      }
    }

    it('returns parameters from cache when present', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      provider.getParametersByNameFromCache.mockResolvedValueOnce({
        cached: {
          '/foo/bar': 'bar',
          '/foo/baz': 'baz',
        },
        toFetch: {},
      });

      // Act
      const parameters = await provider.getParametersBatchByName(
        {
          '/foo/bar': {},
          '/foo/baz': {},
        },
        true,
        true
      );

      // Assess
      expect(parameters).toEqual({
        response: {
          '/foo/bar': 'bar',
          '/foo/baz': 'baz',
        },
        errors: [],
      });
      expect(provider.getParametersByNameFromCache).toHaveBeenCalledTimes(1);
      expect(provider.getParametersByNameInChunks).toHaveBeenCalledTimes(0);
    });

    it('retrieves the parameters from remote when not present in the cache', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      provider.getParametersByNameFromCache.mockResolvedValueOnce({
        cached: {},
        toFetch: {
          '/foo/bar': {},
          '/foo/baz': {},
        },
      });
      provider.getParametersByNameInChunks.mockResolvedValueOnce({
        response: {
          '/foo/bar': 'bar',
          '/foo/baz': 'baz',
        },
        errors: [],
      });

      // Act
      const parameters = await provider.getParametersBatchByName(
        {
          '/foo/bar': {},
          '/foo/baz': {},
        },
        true,
        true
      );

      // Assess
      expect(parameters).toEqual({
        response: {
          '/foo/bar': 'bar',
          '/foo/baz': 'baz',
        },
        errors: [],
      });
      expect(provider.getParametersByNameFromCache).toHaveBeenCalledTimes(1);
      expect(provider.getParametersByNameInChunks).toHaveBeenCalledTimes(1);
      expect(provider.getParametersByNameInChunks).toHaveBeenCalledWith(
        {
          '/foo/bar': {},
          '/foo/baz': {},
        },
        true,
        true
      );
    });

    it('retrieves the parameters not present in the cache and returns them, together with the cached ones', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      provider.getParametersByNameFromCache.mockResolvedValueOnce({
        cached: {
          '/foo/bar': 'bar',
        },
        toFetch: {
          '/foo/baz': {},
        },
      });

      provider.getParametersByNameInChunks.mockResolvedValueOnce({
        response: {
          '/foo/baz': 'baz',
        },
        errors: [],
      });

      // Act
      const parameters = await provider.getParametersBatchByName(
        {
          '/foo/bar': {},
          '/foo/baz': {},
        },
        true,
        true
      );

      // Assess
      expect(parameters).toEqual({
        response: {
          '/foo/bar': 'bar',
          '/foo/baz': 'baz',
        },
        errors: [],
      });
      expect(provider.getParametersByNameFromCache).toHaveBeenCalledTimes(1);
      expect(provider.getParametersByNameInChunks).toHaveBeenCalledTimes(1);
      expect(provider.getParametersByNameInChunks).toHaveBeenCalledWith(
        {
          '/foo/baz': {},
        },
        true,
        true
      );
    });
  });

  describe('Method: getParametersByNameFromCache', () => {
    class SSMProviderMock extends SSMProvider {
      public _add(key: string, value: ExpirableValue): void {
        this.store.set(key, value);
      }

      public async getParametersByNameFromCache(
        parameters: Record<string, SSMGetParametersByNameOptions>
      ): Promise<SSMGetParametersByNameFromCacheOutputType> {
        return super.getParametersByNameFromCache(parameters);
      }
    }

    it('returns an object with parameters split by cached and to fetch', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {},
        '/foo/baz': {},
      };
      provider._add(
        ['/foo/bar', undefined].toString(),
        new ExpirableValue('my-value', 60000)
      );

      // Act
      const { cached, toFetch } =
        await provider.getParametersByNameFromCache(parameters);

      // Assess
      expect(cached).toEqual({
        '/foo/bar': 'my-value',
      });
      expect(toFetch).toEqual({
        '/foo/baz': {},
      });
    });
  });

  describe('Method: getParametersByNameInChunks', () => {
    class SSMProviderMock extends SSMProvider {
      public _getParametersByName = vi.fn();
      public maxGetParametersItems = 1;

      public async getParametersByNameInChunks(
        parameters: Record<string, SSMGetParametersByNameOptions>,
        throwOnError: boolean,
        decrypt: boolean
      ): Promise<SSMGetParametersByNameOutputInterface> {
        return super.getParametersByNameInChunks(
          parameters,
          throwOnError,
          decrypt
        );
      }
    }

    it('splits the parameters in chunks and retrieves them', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {},
        '/foo/baz': {},
      };

      provider._getParametersByName
        .mockResolvedValueOnce({
          response: { '/foo/bar': 'bar' },
          errors: [],
        })
        .mockResolvedValueOnce({
          response: { '/foo/baz': 'baz' },
          errors: [],
        });

      // Act
      const { response, errors } = await provider.getParametersByNameInChunks(
        parameters,
        false,
        false
      );

      // Assess
      expect(response).toEqual({
        '/foo/bar': 'bar',
        '/foo/baz': 'baz',
      });
      expect(errors).toEqual([]);
      expect(provider._getParametersByName).toHaveBeenCalledTimes(2);
    });

    it('throws if any parameter is not found', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {},
        '/foo/baz': {},
      };

      provider._getParametersByName
        .mockResolvedValueOnce({
          response: { '/foo/bar': 'bar' },
          errors: [],
        })
        .mockRejectedValueOnce(new Error('Parameter not found'));

      // Act
      await expect(
        provider.getParametersByNameInChunks(parameters, true, false)
      ).rejects.toThrowError('Parameter not found');
    });

    it('returns an object with params and errors when throwOnError is false', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {},
        '/foo/baz': {},
      };

      provider._getParametersByName
        .mockResolvedValueOnce({
          response: { '/foo/bar': 'bar' },
          errors: [],
        })
        .mockResolvedValueOnce({
          response: {},
          errors: ['/foo/baz'],
        });

      // Act
      const { response, errors } = await provider.getParametersByNameInChunks(
        parameters,
        false,
        false
      );

      // Assess
      expect(response).toEqual({
        '/foo/bar': 'bar',
      });
      expect(errors).toEqual(['/foo/baz']);
    });
  });

  describe('Method: getParametersByNameWithDecryptOption', () => {
    class SSMProviderMock extends SSMProvider {
      public _get = vi.fn();

      public async getParametersByNameWithDecryptOption(
        parameters: Record<string, SSMGetParametersByNameOptions>,
        throwOnError: boolean
      ): Promise<SSMGetParametersByNameOutputInterface> {
        return super.getParametersByNameWithDecryptOption(
          parameters,
          throwOnError
        );
      }
    }

    it('returns an object with the parameters values', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {},
        '/foo/baz': {},
      };
      provider._get.mockResolvedValueOnce('bar').mockResolvedValueOnce('baz');

      // Act
      const { response, errors } =
        await provider.getParametersByNameWithDecryptOption(parameters, false);

      // Assess
      expect(response).toEqual({
        '/foo/bar': 'bar',
        '/foo/baz': 'baz',
      });
      expect(errors).toEqual([]);
    });

    it('returns an object with the params and the errors when throwOnError is set to false', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {},
        '/foo/baz': {},
      };
      provider._get
        .mockResolvedValueOnce('bar')
        .mockRejectedValueOnce(new Error('baz'));

      // Act
      const { response, errors } =
        await provider.getParametersByNameWithDecryptOption(parameters, false);

      // Assess
      expect(response).toEqual({
        '/foo/bar': 'bar',
      });
      expect(errors).toEqual(['/foo/baz']);
    });

    it('throws an error if any parameter retrieval throws and throwOnError is set to true', async () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {},
        '/foo/baz': {},
      };
      provider._get
        .mockResolvedValueOnce('bar')
        .mockRejectedValueOnce(new Error('baz'));

      // Act & Assess
      await expect(
        provider.getParametersByNameWithDecryptOption(parameters, true)
      ).rejects.toThrow();
    });
  });

  describe('Method: handleAnyInvalidGetparameterErrors', () => {
    class SSMProviderMock extends SSMProvider {
      public handleAnyInvalidGetParameterErrors(
        result: Partial<GetParametersCommandOutput>,
        throwOnError: boolean
      ): string[] {
        return SSMProvider.handleAnyInvalidGetParameterErrors(
          result as GetParametersCommandOutput,
          throwOnError
        );
      }
    }

    it('does not throw and returns an empty errors array when no error is thrown', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const result = {
        InvalidParameters: [],
      };

      // Act
      const errors = provider.handleAnyInvalidGetParameterErrors(result, false);

      // Assess
      expect(errors).toEqual([]);
    });

    it('returns the errors array when called with errors', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const result = {
        InvalidParameters: ['/foo/bar', '/foo/baz'],
      };

      // Act
      const errors = provider.handleAnyInvalidGetParameterErrors(result, false);

      // Assess
      expect(errors).toEqual(['/foo/bar', '/foo/baz']);
    });

    it('throws an error when throwOnError is set to true and there are errors', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const result = {
        InvalidParameters: ['/foo/bar', '/foo/baz'],
      };

      // Act & Assess
      expect(() =>
        provider.handleAnyInvalidGetParameterErrors(result, true)
      ).toThrowError('Failed to fetch parameters: /foo/bar, /foo/baz');
    });
  });

  describe('Method: splitBatchAndDecryptParameters', () => {
    class SSMProviderMock extends SSMProvider {
      public splitBatchAndDecryptParameters(
        parameters: Record<string, SSMGetParametersByNameOptions>,
        configs: SSMGetParametersByNameOptions
      ): SSMSplitBatchAndDecryptParametersOutputType {
        return SSMProvider.splitBatchAndDecryptParameters(parameters, configs);
      }
    }

    it('returns an object with all the parameters in batch and none has decrypt set to TRUE', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {},
        '/foo/baz': {
          maxAge: 1000,
        },
      };

      // Act
      const { parametersToFetchInBatch, parametersToDecrypt } =
        provider.splitBatchAndDecryptParameters(parameters, {});

      // Assess
      expect(parametersToDecrypt).toEqual({});
      expect(parametersToFetchInBatch).toEqual({
        '/foo/bar': {},
        '/foo/baz': {
          maxAge: 1000,
        },
      });
    });

    it('returns an object with parameters split by decrypt and not to decrypt', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {
          decrypt: true,
        },
        '/foo/baz': {
          decrypt: false,
        },
      };

      // Act
      const { parametersToFetchInBatch, parametersToDecrypt } =
        provider.splitBatchAndDecryptParameters(parameters, {});

      // Assess
      expect(parametersToDecrypt).toEqual({
        '/foo/bar': {
          decrypt: true,
          transform: undefined,
        },
      });
      expect(parametersToFetchInBatch).toEqual({
        '/foo/baz': {
          decrypt: false,
          transform: undefined,
        },
      });
    });

    it('respects any local overrides by giving them precedence over global config', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        '/foo/bar': {
          decrypt: true,
        },
        '/foo/baz': {
          maxAge: 1000,
        },
      };

      // Act
      const { parametersToFetchInBatch, parametersToDecrypt } =
        provider.splitBatchAndDecryptParameters(parameters, {
          decrypt: false,
          maxAge: 2000,
        });

      // Assess
      expect(parametersToDecrypt).toEqual({
        '/foo/bar': {
          decrypt: true,
          maxAge: 2000,
          transform: undefined,
        },
      });
      expect(parametersToFetchInBatch).toEqual({
        '/foo/baz': {
          decrypt: false,
          maxAge: 1000,
          transform: undefined,
        },
      });
    });
  });

  describe('Method: throwIfErrorsKeyIsPresent', () => {
    class SSMProviderMock extends SSMProvider {
      public throwIfErrorsKeyIsPresent(
        parameters: Record<string, unknown>,
        reservedParameter: string,
        throwOnError: boolean
      ): void {
        SSMProvider.throwIfErrorsKeyIsPresent(
          parameters,
          reservedParameter,
          throwOnError
        );
      }
    }

    it('does not throw when called and no parameter is named _errors', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        foo: 'bar',
        baz: 'qux',
      };

      // Act & Assess
      expect(() =>
        provider.throwIfErrorsKeyIsPresent(parameters, '_errors', false)
      ).not.toThrow();
    });

    it('does not throw when called and a parameter is named _errors, and throwOnError is set to false (graceful error mode)', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        foo: 'bar',
        baz: 'qux',
        _errors: 'baz',
      };

      // Act & Assess
      expect(() =>
        provider.throwIfErrorsKeyIsPresent(parameters, '_errors', false)
      ).toThrow(
        'You cannot fetch a parameter named _errors in graceful error mode.'
      );
    });

    it('throws when called and a parameter is named _errors, and throwOnError is set to true (fail fast mode)', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const parameters = {
        foo: 'bar',
        baz: 'qux',
        _errors: 'baz',
      };

      // Act & Assess
      expect(() =>
        provider.throwIfErrorsKeyIsPresent(parameters, '_errors', true)
      ).not.toThrow();
    });
  });

  describe('Method: transformAndCacheGetParametersResponse', () => {
    class SSMProviderMock extends SSMProvider {
      public transformAndCacheGetParametersResponse(
        response: Partial<GetParametersCommandOutput>,
        parameters: Record<string, SSMGetParametersByNameOptions>,
        throwOnError: boolean
      ): Record<string, unknown> {
        return super.transformAndCacheGetParametersResponse(
          response as GetParametersCommandOutput,
          parameters,
          throwOnError
        );
      }
    }

    it('returns an empty object when called with a response that has no Parameters list', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const response = {};

      // Act
      const parameters = provider.transformAndCacheGetParametersResponse(
        response,
        {},
        false
      );

      // Assess
      expect(parameters).toEqual({});
    });

    it('returns an empty object when called with an empty response', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const response = {
        Parameters: [],
      };

      // Act
      const parameters = provider.transformAndCacheGetParametersResponse(
        response,
        {},
        false
      );

      // Assess
      expect(parameters).toEqual({});
    });

    it('returns an object with the parameters when called with a response', () => {
      // Prepare
      const provider = new SSMProviderMock();
      const response = {
        Parameters: [
          {
            Name: '/foo/bar',
            Value: toBase64(encoder.encode('bar')).toString(),
          },
          {
            Name: '/foo/baz',
            Value: 'baz',
          },
        ],
      };

      // Act
      const parameters = provider.transformAndCacheGetParametersResponse(
        response,
        {
          '/foo/bar': {
            transform: 'binary',
          },
          '/foo/baz': {},
        },
        false
      );

      // Assess
      expect(parameters).toEqual({
        '/foo/bar': 'bar',
        '/foo/baz': 'baz',
      });
    });
  });

  describe('Method: set', () => {
    it('sets a parameter successfully', async () => {
      const provider: SSMProvider = new SSMProvider();
      const client = mockClient(SSMClient)
        .on(PutParameterCommand)
        .resolves({ Version: 1 });
      const parameterName: string = '/my-parameter';
      const options: SSMSetOptions = { value: 'my-value' };

      const version = await provider.set(parameterName, options);

      expect(version).toBe(1);
      expect(client).toReceiveCommandWith(PutParameterCommand, {
        Name: parameterName,
        Value: options.value,
      });
    });

    it('sets a parameter with sdk options successfully', async () => {
      const provider: SSMProvider = new SSMProvider();
      const client = mockClient(SSMClient)
        .on(PutParameterCommand)
        .resolves({ Version: 1 });
      const parameterName: string = '/my-parameter';
      const options: SSMSetOptions = {
        value: 'my-value',
        sdkOptions: { Overwrite: true },
      };

      const version = await provider.set(parameterName, options);

      expect(version).toBe(1);
      expect(client).toReceiveCommandWith(PutParameterCommand, {
        Name: parameterName,
        Value: options.value,
        Overwrite: true,
      });
    });

    it('throws an error if setting a parameter fails', async () => {
      const provider: SSMProvider = new SSMProvider();
      mockClient(SSMClient)
        .on(PutParameterCommand)
        .rejects(new Error('Failed to set parameter'));
      const parameterName: string = '/my-parameter';
      const options: SSMSetOptions = { value: 'my-value' };

      await expect(provider.set(parameterName, options)).rejects.toThrow(
        `Unable to set parameter with name ${parameterName}`
      );
    });

    it.each([
      ['overwrite', true, 'Overwrite'],
      ['description', 'my-description', 'Description'],
      ['parameterType', 'SecureString', 'Type'],
      ['tier', 'Advanced', 'Tier'],
      ['kmsKeyId', 'my-key-id', 'KeyId'],
    ])('sets a parameter with %s option', async (key, value, sdkKey) => {
      const provider: SSMProvider = new SSMProvider();
      const client = mockClient(SSMClient)
        .on(PutParameterCommand)
        .resolves({ Version: 1 });
      const parameterName: string = '/my-parameter';
      const options: SSMSetOptions = { value: 'my-value', [key]: value };

      const version = await provider.set(parameterName, options);

      expect(version).toBe(1);
      expect(client).toReceiveCommandWith(PutParameterCommand, {
        Name: parameterName,
        Value: options.value,
        [sdkKey]: value,
      });
    });
  });
});
