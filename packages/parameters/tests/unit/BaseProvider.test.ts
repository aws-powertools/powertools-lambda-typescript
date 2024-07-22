/**
 * Test BaseProvider class
 *
 * @group unit/parameters/baseProvider/class
 */
import {
  BaseProvider,
  DEFAULT_PROVIDERS,
  GetOptions,
  GetMultipleOptions,
} from '../../src/base/index.js';
import { DEFAULT_MAX_AGE_SECS } from '../../src/constants.js';
import type { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';
import { ExpirableValue } from '../../src/base/ExpirableValue.js';
import {
  GetParameterError,
  TransformParameterError,
  clearCaches,
} from '../../src/index.js';
import { toBase64 } from '@smithy/util-base64';

const encoder = new TextEncoder();
jest.mock('@aws-lambda-powertools/commons', () => ({
  ...jest.requireActual('@aws-lambda-powertools/commons'),
  addUserAgentMiddleware: jest.fn(),
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
    jest.clearAllMocks();
  });

  describe('Method: addToCache', () => {
    test('when called with a value and maxAge equal to 0, it skips the cache entirely', () => {
      // Prepare
      const provider = new TestProvider();

      // Act
      provider.addToCache('my-key', 'value', 0);

      // Assess
      expect(provider._getKeyTest('my-key')).toBeUndefined();
    });

    test('when called with a value and maxAge, it places the value in the cache', () => {
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
    test('when the underlying _get method throws an error, it throws a GetParameterError', async () => {
      // Prepare
      const provider = new TestProvider();

      // Act & Assess
      await expect(provider.get('my-parameter')).rejects.toThrowError(
        GetParameterError
      );
    });

    test('when called and a cached value is available, it returns an the cached value', async () => {
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

    test('when called with forceFetch, even whith cached value available, it returns the remote value', async () => {
      // Prepare
      const mockData = 'my-remote-value';
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_get')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );
      provider._add(
        ['my-parameter', undefined].toString(),
        new ExpirableValue('my-value', 5000)
      );

      // Act
      const values = await provider.get('my-parameter', { forceFetch: true });

      // Assess
      expect(values).toEqual('my-remote-value');
    });

    test('when called and cached value is expired, it returns the remote value', async () => {
      // Prepare
      const mockData = 'my-remote-value';
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_get')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );
      const expirableValue = new ExpirableValue('my-other-value', 0);
      jest.spyOn(expirableValue, 'isExpired').mockImplementation(() => true);
      provider._add(['my-path', undefined].toString(), expirableValue);

      // Act
      const values = await provider.get('my-parameter');

      // Assess
      expect(values).toEqual('my-remote-value');
    });

    test('when called with a json transform, and the value is a valid string representation of a JSON, it returns an object', async () => {
      // Prepare
      const mockData = JSON.stringify({ foo: 'bar' });
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_get')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act
      const value = await provider.get('my-parameter', { transform: 'json' });

      // Assess
      expect(typeof value).toBe('object');
      expect(value).toMatchObject({
        foo: 'bar',
      });
    });

    test('when called with a json transform, and the value is NOT a valid string representation of a JSON, it throws', async () => {
      // Prepare
      const mockData = `${JSON.stringify({ foo: 'bar' })}{`;
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_get')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act & Assess
      await expect(
        provider.get('my-parameter', { transform: 'json' })
      ).rejects.toThrowError(TransformParameterError);
    });

    test('when called with a binary transform, and the value is a valid string representation of a binary, it returns the decoded value', async () => {
      // Prepare
      const mockData = toBase64(encoder.encode('my-value'));
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_get')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act
      const value = await provider.get('my-parameter', { transform: 'binary' });

      // Assess
      expect(typeof value).toBe('string');
      expect(value).toEqual('my-value');
    });

    test('when called with a binary transform, and the value is NOT a valid string representation of a binary, it throws', async () => {
      // Prepare
      const mockData = 'qw';
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_get')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act & Assess
      await expect(
        provider.get('my-parameter', { transform: 'binary' })
      ).rejects.toThrowError(TransformParameterError);
    });

    test('when called with no transform, and the value is a valid binary, it returns the binary as-is', async () => {
      // Prepare
      const mockData = encoder.encode('my-value');
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_get')
        .mockImplementation(
          () =>
            new Promise((resolve, _reject) =>
              resolve(mockData as unknown as string)
            )
        );

      // Act
      const value = await provider.get('my-parameter');

      // Assess
      expect(value).toBeInstanceOf(Uint8Array);
      expect(value).toEqual(mockData);
    });

    test('when called with a binary transform, and the value is a valid binary but NOT base64 encoded, it throws', async () => {
      // Prepare
      const mockData = encoder.encode('my-value');
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_get')
        .mockImplementation(
          () =>
            new Promise((resolve, _reject) =>
              resolve(mockData as unknown as string)
            )
        );

      // Act & Assess
      await expect(
        provider.get('my-parameter', { transform: 'binary' })
      ).rejects.toThrowError(TransformParameterError);
    });

    test('when called with an auto transform, and the value is a valid JSON, it returns the parsed value', async () => {
      // Prepare
      const mockData = JSON.stringify({ foo: 'bar' });
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_get')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act
      const value = await provider.get('my-parameter.json', {
        transform: 'auto',
      });

      // Assess
      expect(value).toStrictEqual({ foo: 'bar' });
    });
  });

  describe('Method: getMultiple', () => {
    test('when the underlying _getMultiple throws an error, it throws a GetParameterError', async () => {
      // Prepare
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () =>
            new Promise((_resolve, reject) => reject(new Error('Some error.')))
        );

      // Act & Assess
      await expect(provider.getMultiple('my-parameter')).rejects.toThrowError(
        GetParameterError
      );
    });

    test('when the underlying _getMultiple does not return an object, it throws a GetParameterError', async () => {
      // Prepare
      const provider = new TestProvider();
      jest.spyOn(provider, '_getMultiple').mockImplementation(
        () =>
          new Promise((resolve, _reject) =>
            // need to type cast to force the error
            resolve('not an object' as unknown as Record<string, string>)
          )
      );

      // Act & Assess
      await expect(provider.getMultiple('my-parameter')).rejects.toThrowError(
        GetParameterError
      );
    });

    test('when called with a json transform, and all the values are a valid string representation of a JSON, it returns an object with all the values', async () => {
      // Prepare
      const mockData = { A: JSON.stringify({ foo: 'bar' }) };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

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

    test('when called, it returns an object with the values', async () => {
      // Prepare
      const mockData = { A: 'foo', B: 'bar' };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act
      const values = await provider.getMultiple('my-path');

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        A: 'foo',
        B: 'bar',
      });
    });

    test('when called with a json transform, and one of the values is NOT a valid string representation of a JSON, it returns an object with partial failures', async () => {
      // Prepare
      const mockData = {
        A: JSON.stringify({ foo: 'bar' }),
        B: `${JSON.stringify({ foo: 'bar' })}{`,
      };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

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

    test('when called with a json transform and throwOnTransformError equal to TRUE, and at least ONE the values is NOT a valid string representation of a JSON, it throws', async () => {
      // Prepare
      const mockData = { A: `${JSON.stringify({ foo: 'bar' })}{` };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act & Assess
      await expect(
        provider.getMultiple('my-path', {
          transform: 'json',
          throwOnTransformError: true,
        })
      ).rejects.toThrowError(TransformParameterError);
    });

    test('when called with a binary transform, and all the values are a valid string representation of a binary, it returns an object with all the values', async () => {
      // Prepare
      const mockData = { A: toBase64(encoder.encode('my-value')).toString() };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

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

    test('when called with a binary transform, and one of the values is NOT a valid string representation of a binary, it returns an object with partial failures', async () => {
      // Prepare
      const mockData = { A: toBase64(encoder.encode('my-value')), B: 'qw' };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

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

    test('when called with a binary transform and throwOnTransformError equal to TRUE, and at least ONE the values is NOT a valid string representation of a binary, it throws', async () => {
      // Prepare
      const mockData = { A: 'qw' };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act & Assess
      await expect(
        provider.getMultiple('my-path', {
          transform: 'binary',
          throwOnTransformError: true,
        })
      ).rejects.toThrowError(TransformParameterError);
    });

    test('when called with auto transform and the key of the parameter ends with `.binary`, and all the values are a valid string representation of a binary, it returns an object with all the transformed values', async () => {
      // Prepare
      const mockData = { 'A.binary': toBase64(encoder.encode('my-value')) };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'auto',
      });

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        'A.binary': 'my-value',
      });
    });

    test('when called with auto transform and the key of the parameter DOES NOT end with `.binary` or `.json`, it returns an object with all the values NOT transformed', async () => {
      // Prepare
      const mockBinary = toBase64(encoder.encode('my-value'));
      const mockData = { 'A.foo': mockBinary };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'auto',
      });

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        'A.foo': mockBinary,
      });
    });

    test('when called with a binary transform, and at least ONE the values is undefined, it returns an object with one of the values undefined', async () => {
      // Prepare
      const mockData = { A: undefined };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );

      // Act
      const values = await provider.getMultiple('my-path', {
        transform: 'auto',
      });

      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        A: undefined,
      });
    });

    test('when called and values cached are available, it returns an object with the cached values', async () => {
      // Prepare
      const provider = new TestProvider();
      provider._add(
        ['my-path', undefined].toString(),
        new ExpirableValue({ A: 'my-value' }, 60000)
      );

      // Act
      const values = await provider.getMultiple('my-path');

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        A: 'my-value',
      });
    });

    test('when called and values cached are expired, it returns an object with the remote values', async () => {
      // Prepare
      const mockData = { A: 'my-value' };
      const provider = new TestProvider();
      jest
        .spyOn(provider, '_getMultiple')
        .mockImplementation(
          () => new Promise((resolve, _reject) => resolve(mockData))
        );
      const expirableValue = new ExpirableValue({ B: 'my-other-value' }, 0);
      jest.spyOn(expirableValue, 'isExpired').mockImplementation(() => true);
      provider._add(['my-path', undefined].toString(), expirableValue);

      // Act
      const values = await provider.getMultiple('my-path');

      // Assess
      expect(typeof values).toBe('object');
      expect(values).toMatchObject({
        A: 'my-value',
      });
    });
  });

  describe('Method: clearCache', () => {
    test('when called, it clears the store', () => {
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
  test('when called, it clears all the caches', () => {
    // Prepare
    const provider1 = new TestProvider();
    const provider2 = new TestProvider();
    const provider1Spy = jest.spyOn(provider1, 'clearCache');
    const provider2Spy = jest.spyOn(provider2, 'clearCache');
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
  it('should set the default maxAge when not provided', () => {
    // Prepare
    const envVarsService = {
      getParametersMaxAge: jest.fn(),
    };
    const options = new GetOptions(
      envVarsService as unknown as EnvironmentVariablesService,
    );

    // Assess
    expect(options.maxAge).toBe(DEFAULT_MAX_AGE_SECS);
  });
});

describe('Class: GetMultipleOptions', () => {
  it('should set throwOnTransformError to false when not provided', () => {
    // Prepare
    const envVarsService = {
      getParametersMaxAge: jest.fn(),
    };
    const options = new GetMultipleOptions(
      envVarsService as unknown as EnvironmentVariablesService,
    );

    // Assess
    expect(options.throwOnTransformError).toBe(false);
  });
});
