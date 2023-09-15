/**
 * Test SSMProvider class
 *
 * @group unit/parameters/ssm/class
 */
import { SSMProvider } from '../../src/ssm';
import {
  SSMClient,
  GetParameterCommand,
  GetParametersCommand,
  GetParametersByPathCommand,
} from '@aws-sdk/client-ssm';
import type { GetParametersCommandOutput } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import type {
  SSMProviderOptions,
  SSMGetParametersByNameFromCacheOutputType,
  SSMGetParametersByNameOptions,
  SSMSplitBatchAndDecryptParametersOutputType,
  SSMGetParametersByNameOutputInterface,
} from '../../src/types/SSMProvider';
import { ExpirableValue } from '../../src/base/ExpirableValue';
import { toBase64 } from '@aws-sdk/util-base64-node';
import * as UserAgentMiddleware from '@aws-lambda-powertools/commons/lib/userAgentMiddleware';

const encoder = new TextEncoder();

describe('Class: SSMProvider', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  describe('Method: constructor', () => {
    test('when the class instantiates without SDK client and client config it has default options', async () => {
      // Prepare
      const options: SSMProviderOptions = {};
      const userAgentSpy = jest.spyOn(
        UserAgentMiddleware,
        'addUserAgentMiddleware'
      );

      // Act
      const provider = new SSMProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'SSM',
        })
      );
      expect(userAgentSpy).toHaveBeenCalled();
    });

    test('when the user provides a client config in the options, the class instantiates a new client with client config options', async () => {
      // Prepare
      const options: SSMProviderOptions = {
        clientConfig: {
          serviceId: 'with-client-config',
        },
      };
      const userAgentSpy = jest.spyOn(
        UserAgentMiddleware,
        'addUserAgentMiddleware'
      );

      // Act
      const provider = new SSMProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'with-client-config',
        })
      );
      expect(userAgentSpy).toHaveBeenCalled();
    });

    test('when the user provides an SDK client in the options, the class instantiates with it', async () => {
      // Prepare
      const awsSdkV3Client = new SSMClient({
        serviceId: 'with-custom-sdk-client',
      });

      const options: SSMProviderOptions = {
        awsSdkV3Client: awsSdkV3Client,
      };
      const userAgentSpy = jest.spyOn(
        UserAgentMiddleware,
        'addUserAgentMiddleware'
      );

      // Act
      const provider = new SSMProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'with-custom-sdk-client',
        })
      );
      expect(userAgentSpy).toHaveBeenCalledWith(awsSdkV3Client, 'parameters');
    });

    test('when the user provides NOT an SDK client in the options, it throws an error', async () => {
      // Prepare
      const awsSdkV3Client = {};
      const options: SSMProviderOptions = {
        awsSdkV3Client: awsSdkV3Client as SSMClient,
      };

      // Act & Assess
      expect(() => {
        new SSMProvider(options);
      }).toThrow();
    });
  });

  describe('Method: getParametersByName', () => {
    class SSMProviderMock extends SSMProvider {
      public getParametersBatchByName = jest.fn();
      public getParametersByNameWithDecryptOption = jest.fn();

      public constructor() {
        super();
      }
    }

    test('when called with no parameters to decrypt, it calls both getParametersByNameWithDecryptOption and getParametersBatchByName, then returns', async () => {
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

    test('when called with all parameters to decrypt, it calls only getParametersBatchByName', async () => {
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

    test('when called with some parameters to decrypt, it calls both getParametersByNameWithDecryptOption and getParametersBatchByName, then returns', async () => {
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

    test('when called and getParametersBatchByName returns an error and throwOnError is false, it returns the errors', async () => {
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

    test('when called and getParametersBatchByName returns an error and throwOnError is false, it returns the errors', async () => {
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
    test('when called without any options but with POWERTOOLS_PARAMETERS_SSM_DECRYPT env var enabled, it gets the parameter with decryption', async () => {
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

    test('when called without sdkOptions, it gets the parameter using the name and with no decryption', async () => {
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

    test('when called with sdkOptions, it gets the parameter using the parameters', async () => {
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

    test('when called with the decrypt option, the WithDecryption parameter is passed to the sdk client', async () => {
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
    test('when called with only a path, it passes it to the sdk', async () => {
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

    test('when called with a path and sdkOptions, it passes them to the sdk', async () => {
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

    test('when called with no options, it uses the default sdk options', async () => {
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

    test('when called with decrypt or recursive, it passes them to the sdk', async () => {
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

    test('when multiple parameters that share the same path as suffix are retrieved, it returns an object with the names only', async () => {
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

    test('when multiple pages are found, it returns an object with all the parameters', async () => {
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
      public transformAndCacheGetParametersResponse = jest.fn();

      public constructor() {
        super();
      }

      public _getParametersByName(
        parameters: Record<string, SSMGetParametersByNameOptions>,
        throwOnError: boolean,
        decrypt: boolean
      ): Promise<SSMGetParametersByNameOutputInterface> {
        return super._getParametersByName(parameters, throwOnError, decrypt);
      }
    }

    test('when called with a list of parameters, it passes them to the sdk', async () => {
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
      public getParametersByNameFromCache = jest.fn();
      public getParametersByNameInChunks = jest.fn();

      public constructor() {
        super();
      }

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

    test('when called with a list of parameters, if they are all cached, it returns them immediately', async () => {
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

    test('when called with a list of parameters, if none of them are cached, it retrieves them and then returns', async () => {
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

    test('when called with a list of parameters, if some of them are cached, it retrieves the missing ones, and then returns them all', async () => {
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
      public constructor() {
        super();
      }

      public _add(key: string, value: ExpirableValue): void {
        this.store.set(key, value);
      }

      public async getParametersByNameFromCache(
        parameters: Record<string, SSMGetParametersByNameOptions>
      ): Promise<SSMGetParametersByNameFromCacheOutputType> {
        return super.getParametersByNameFromCache(parameters);
      }
    }

    test('when called with a batch of parameters, it returns an object with parameters split by cached and to fetch', async () => {
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
      public _getParametersByName = jest.fn();
      public maxGetParametersItems = 1;

      public constructor() {
        super();
      }

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

    test('when called with a batch of parameters to retrieve, it splits them in chunks and retrieves them', async () => {
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

    test('when retrieving parameters, if throwOnError is true, it throws an error if any parameter is not found', async () => {
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

    test('when retrieving parameters, if throwOnError is false, it returns an object with the parameters values and the errors', async () => {
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
      public _get = jest.fn();

      public constructor() {
        super();
      }

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

    test('when called with a batch of parameters to retrieve, it returns an object with the parameters values', async () => {
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

    test('when called with a batch of parameters to retrieve, and throwOnError is set to false, it returns an object with the parameters values and the errors', async () => {
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

    test('when called with a batch of parameters to retrieve, and throwOnError is set to true, it throws an error if any parameter retrieval throws', async () => {
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
      public constructor() {
        super();
      }

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

    test('when called without any errors, it does not throw and returns an empty errors array', () => {
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

    test('when called with errors, and throwOnError is set to false, it returns the errors array', () => {
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

    test('when called with errors, and throwOnError is set to true, it throws an error', () => {
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
      public constructor() {
        super();
      }

      public splitBatchAndDecryptParameters(
        parameters: Record<string, SSMGetParametersByNameOptions>,
        configs: SSMGetParametersByNameOptions
      ): SSMSplitBatchAndDecryptParametersOutputType {
        return SSMProvider.splitBatchAndDecryptParameters(parameters, configs);
      }
    }

    test('when called with a batch of parameters, and none has decrypt set to TRUE, it returns an object with all the parameters in batch', () => {
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

    test('when called with a batch of parameters, it returns an object with parameters split by decrypt and not to decrypt', () => {
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

    test('when called with a batch of parameters, it respects any local overrides by giving them precedence over global config', () => {
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
      public constructor() {
        super();
      }

      public throwIfErrorsKeyIsPresent(
        parameters: Record<string, unknown>,
        reservedParameter: string,
        throwOnError: boolean
      ): void {
        return SSMProvider.throwIfErrorsKeyIsPresent(
          parameters,
          reservedParameter,
          throwOnError
        );
      }
    }

    test('when called and no parameter is named _errors, it does not throw', () => {
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

    test('when called and a parameter is named _errors, and throwOnError is set to false (graceful error mode), it does not throw', () => {
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

    test('when called and a parameter is named _errors, and throwOnError is set to true (fail fast mode), it throws an error', () => {
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
      public constructor() {
        super();
      }

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

    test('when called with a response that has no Parameters list, it returns an empty object', () => {
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

    test('when called with an empty response, it returns an empty object', () => {
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

    test('when called with a response, it returns an object with the parameters', () => {
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
});
