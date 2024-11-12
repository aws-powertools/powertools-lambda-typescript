import { toBase64 } from '@smithy/util-base64';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExpirableValue } from '../../src/base/ExpirableValue.js';
import {
  BaseProvider,
  DEFAULT_PROVIDERS,
  GetMultipleOptions,
  GetOptions,
} from '../../src/base/index.js';
import type { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';
import { DEFAULT_MAX_AGE_SECS } from '../../src/constants.js';
import {
  GetParameterError,
  TransformParameterError,
  clearCaches,
} from '../../src/index.js';

const encoder = new TextEncoder();
vi.mock('@aws-lambda-powertools/commons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-lambda-powertools/commons')>()),
  addUserAgentMiddleware: vi.fn(),
}));

class TestProvider extends BaseProvider {
  public constructor() {
    super({
      proto: class {
        #name = 'TestProvider';

        public hello(): string {
          return this.#name;
        }
      },
    });
  }

  public _add(key: string, value: ExpirableValue): void {
    this.store.set(key, value);
  }

  public _get(_name: string): Promise<string> {
    throw Error('Not implemented.');
  }

  public _getKeyTest(key: string): ExpirableValue | undefined {
    return this.store.get(key);
  }

  public _getMultiple(
    _path: string
  ): Promise<Record<string, string | undefined>> {
    throw Error('Not implemented.');
  }

  public _getStoreSize(): number {
    return this.store.size;
  }
}

describe('Class: BaseProvider', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Method: addToCache', () => {
    it('skips the cache when maxAge is set to 0', () => {
      // Prepare
      const provider = new TestProvider();

      // Act
      provider.addToCache('my-key', 'value', 0);

      // Assess
      expect(provider._getKeyTest('my-key')).toBeUndefined();
    });

    it('sets the value in the cache when maxAge is set', () => {
      // Prepare
      const provider = new TestProvider();

      // Act
      provider.addToCache('my-key', 'my-value', 5000);

      // Assess
      expect(provider._getKeyTest('my-key')).toEqual(
        expect.objectContaining({
          value: 'my-value',
        })
      );
    });
  });

  describe('Method: get', () => {
    it('throws a GetParameterError when the underlying _get method throws an error', async () => {
      // Prepare
      const provider = new TestProvider();

      // Act & Assess
      await expect(provider.get('my-parameter')).rejects.toThrowError(
        GetParameterError
      );
    });

    it('returns the cached value when one is available in the cache', async () => {
      // Prepare
      const provider = new TestProvider();
      provider._add(
        ['my-parameter', undefined].toString(),
        new ExpirableValue('my-value', 5000)
      );

      // Act
      const values = await provider.get('my-parameter');

      // Assess
      expect(values).toEqual('my-value');
    });

    it('skips the cache when forceFetch is set', async () => {
      // Prepare
      const mockData = 'my-remote-value';
      const provider = new TestProvider();
      vi.spyOn(provider, '_get').mockResolvedValue(mockData);
      provider._add(
        ['my-parameter', undefined].toString(),
        new ExpirableValue('my-value', 5000)
      );

      // Act
      const values = await provider.get('my-parameter', { forceFetch: true });

      // Assess
      expect(values).toEqual('my-remote-value');
    });

    it('returns the remote value when the cached one is expired', async () => {
      // Prepare
      const mockData = 'my-remote-value';
      const provider = new TestProvider();
      vi.spyOn(provider, '_get').mockResolvedValue(mockData);
      const expirableValue = new ExpirableValue('my-other-value', 0);
      vi.spyOn(expirableValue, 'isExpired').mockImplementation(() => true);
      provider._add(['my-path', undefined].toString(), expirableValue);

      // Act
      const values = await provider.get('my-parameter');

      // Assess
      expect(values).toEqual('my-remote-value');
    });

    it('transforms a JSON object', async () => {
      // Prepare
      const mockData = JSON.stringify({ foo: 'bar' });
      const provider = new TestProvider();
      vi.spyOn(provider, '_get').mockResolvedValue(mockData);

      // Act
      const value = await provider.get('my-parameter', { transform: 'json' });

      // Assess
      expect(typeof value).toBe('object');
      expect(value).toMatchObject({
        foo: 'bar',
      });
    });

    it('throws when attempting to transform an invalid JSON', async () => {
      // Prepare
      const mockData = `${JSON.stringify({ foo: 'bar' })}{`;
      const provider = new TestProvider();
      vi.spyOn(provider, '_get').mockResolvedValue(mockData);

      // Act & Assess
      await expect(
        provider.get('my-parameter', { transform: 'json' })
      ).rejects.toThrowError(TransformParameterError);
    });

    it('returns the decoded value when called with a binary transform, and the value is a valid string representation of a binary', async () => {
      // Prepare
      const mockData = toBase64(encoder.encode('my-value'));
      const provider = new TestProvider();
      vi.spyOn(provider, '_get').mockResolvedValue(mockData);

      // Act
      const value = await provider.get('my-parameter', { transform: 'binary' });

      // Assess
      expect(typeof value).toBe('string');
      expect(value).toEqual('my-value');
    });

    it('throws when called with a binary transform, and the value is NOT a valid string representation of a binary', async () => {
      // Prepare
      const mockData = 'qw';
      const provider = new TestProvider();
      vi.spyOn(provider, '_get').mockResolvedValue(mockData);

      // Act & Assess
      await expect(
        provider.get('my-parameter', { transform: 'binary' })
      ).rejects.toThrowError(TransformParameterError);
    });

    it('returns the binary as-is when called with no transform, and the value is a valid binary', async () => {
      // Prepare
      const mockData = encoder.encode('my-value');
      const provider = new TestProvider();
      vi.spyOn(provider, '_get').mockResolvedValue(
        mockData as unknown as string
      );

      // Act
      const value = await provider.get('my-parameter');

      // Assess
      expect(value).toBeInstanceOf(Uint8Array);
      expect(value).toEqual(mockData);
    });

    it('throws when called with a binary transform, and the value is a valid binary but NOT base64 encoded', async () => {
      // Prepare
      const mockData = encoder.encode('my-value');
      const provider = new TestProvider();
      vi.spyOn(provider, '_get').mockResolvedValue(
        mockData as unknown as string
      );

      // Act & Assess
      await expect(
        provider.get('my-parameter', { transform: 'binary' })
      ).rejects.toThrowError(TransformParameterError);
    });

    it('returns the parsed value when called with an auto transform, and the value is a valid JSON', async () => {
      // Prepare
      const mockData = JSON.stringify({ foo: 'bar' });
      const provider = new TestProvider();
      vi.spyOn(provider, '_get').mockResolvedValue(mockData);

      // Act
      const value = await provider.get('my-parameter.json', {
        transform: 'auto',
      });

      // Assess
      expect(value).toStrictEqual({ foo: 'bar' });
    });
  });

  describe('Method: getMultiple', () => {
    it('throws a GetParameterError when the underlying _getMultiple throws', async () => {
      // Prepare
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockRejectedValue(
        new Error('Some error.')
      );

      // Act & Assess
      await expect(provider.getMultiple('my-parameter')).rejects.toThrowError(
        GetParameterError
      );
    });

    it('throws a GetParameterError when the underlying _getMultiple does not return an object', async () => {
      // Prepare
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(
        'not an object' as unknown as Record<string, string>
      );

      // Act & Assess
      await expect(provider.getMultiple('my-parameter')).rejects.toThrowError(
        GetParameterError
      );
    });

    it('returns an object with transformed values when called with a json transform, and all the values are valid', async () => {
      // Prepare
      const mockData = { A: JSON.stringify({ foo: 'bar' }) };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'json',
      });

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        A: {
          foo: 'bar',
        },
      });
    });

    it('it returns an object with the transformed values', async () => {
      // Prepare
      const mockData = { A: 'foo', B: 'bar' };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act
      const values = await provider.getMultiple('my-path');

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        A: 'foo',
        B: 'bar',
      });
    });

    it('returns an object with partial failures when called with a json transform, and one of the values is NOT a valid string representation of a JSON', async () => {
      // Prepare
      const mockData = {
        A: JSON.stringify({ foo: 'bar' }),
        B: `${JSON.stringify({ foo: 'bar' })}{`,
      };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'json',
      });

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        A: {
          foo: 'bar',
        },
        B: undefined,
      });
    });

    it('throws when called with a json transform and throwOnTransformError equal to TRUE, and at least ONE the values is NOT a valid string representation of a JSON', async () => {
      // Prepare
      const mockData = { A: `${JSON.stringify({ foo: 'bar' })}{` };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act & Assess
      await expect(
        provider.getMultiple('my-path', {
          transform: 'json',
          throwOnTransformError: true,
        })
      ).rejects.toThrowError(TransformParameterError);
    });

    it('returns an object with transformed values and binary transform is used on valid string representation of a binaries', async () => {
      // Prepare
      const mockData = { A: toBase64(encoder.encode('my-value')).toString() };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'binary',
      });

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        A: 'my-value',
      });
    });

    it('returns an object with partial failures when called with a binary transform, and one of the values is NOT a valid string representation of a binary', async () => {
      // Prepare
      const mockData = { A: toBase64(encoder.encode('my-value')), B: 'qw' };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'binary',
      });

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        A: 'my-value',
        B: undefined,
      });
    });

    it('throws when called with a binary transform and throwOnTransformError equal to TRUE, and at least ONE the values is NOT a valid string representation of a binary', async () => {
      // Prepare
      const mockData = { A: 'qw' };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act & Assess
      await expect(
        provider.getMultiple('my-path', {
          transform: 'binary',
          throwOnTransformError: true,
        })
      ).rejects.toThrowError(TransformParameterError);
    });

    it('returns an object with the transformed values when auto transform is used and the key of the parameter ends with `.binary`', async () => {
      // Prepare
      const mockData = { 'A.binary': toBase64(encoder.encode('my-value')) };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'auto',
      });

      // Assess
      expect(values).toStrictEqual({
        'A.binary': 'my-value',
      });
    });

    it('leaves the values untransformed when using auto transform and the name does not end in `.binary` or `.json`', async () => {
      // Prepare
      const mockBinary = toBase64(encoder.encode('my-value'));
      const mockData = { 'A.foo': mockBinary };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'auto',
      });

      // Assess
      expect(values).toStrictEqual({
        'A.foo': mockBinary,
      });
    });

    it('handles undefined values by leaving them as-is', async () => {
      // Prepare
      const mockData = { A: undefined };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'auto',
      });

      expect(values).toStrictEqual({
        A: undefined,
      });
    });

    it('returns an object with cached values when available', async () => {
      // Prepare
      const provider = new TestProvider();
      provider._add(
        ['my-path', undefined].toString(),
        new ExpirableValue({ A: 'my-value' }, 60000)
      );

      // Act
      const values = await provider.getMultiple('my-path');

      // Assess
      expect(values).toStrictEqual({
        A: 'my-value',
      });
    });

    it('returns an object with the remote values when the cached ones are expired', async () => {
      // Prepare
      const mockData = { A: 'my-value' };
      const provider = new TestProvider();
      vi.spyOn(provider, '_getMultiple').mockResolvedValue(mockData);
      const expirableValue = new ExpirableValue({ B: 'my-other-value' }, 0);
      vi.spyOn(expirableValue, 'isExpired').mockImplementation(() => true);
      provider._add(['my-path', undefined].toString(), expirableValue);

      // Act
      const values = await provider.getMultiple('my-path');

      // Assess
      expect(values).toStrictEqual({
        A: 'my-value',
      });
    });
  });

  describe('Method: clearCache', () => {
    it('clears the store', () => {
      // Prepare
      const provider = new TestProvider();
      provider._add(
        ['my-path', undefined].toString(),
        new ExpirableValue({ B: 'my-other-value' }, 0)
      );

      // Act
      provider.clearCache();

      // Assess
      expect(provider._getStoreSize()).toBe(0);
    });
  });
});

describe('Function: clearCaches', () => {
  it('clears all the caches', () => {
    // Prepare
    const provider1 = new TestProvider();
    const provider2 = new TestProvider();
    const provider1Spy = vi.spyOn(provider1, 'clearCache');
    const provider2Spy = vi.spyOn(provider2, 'clearCache');
    DEFAULT_PROVIDERS.ssm = provider1;
    DEFAULT_PROVIDERS.secretsManager = provider2;

    // Act
    clearCaches();

    // Assess
    expect(provider1Spy).toBeCalledTimes(1);
    expect(provider2Spy).toBeCalledTimes(1);
  });
});

describe('Class: GetOptions', () => {
  it('sets the default maxAge when not provided', () => {
    // Prepare
    const envVarsService = {
      getParametersMaxAge: vi.fn(),
    };
    const options = new GetOptions(
      envVarsService as unknown as EnvironmentVariablesService
    );

    // Assess
    expect(options.maxAge).toBe(DEFAULT_MAX_AGE_SECS);
  });
});

describe('Class: GetMultipleOptions', () => {
  it('sets throwOnTransformError to false when not provided', () => {
    // Prepare
    const envVarsService = {
      getParametersMaxAge: vi.fn(),
    };
    const options = new GetMultipleOptions(
      envVarsService as unknown as EnvironmentVariablesService
    );

    // Assess
    expect(options.throwOnTransformError).toBe(false);
  });
});
