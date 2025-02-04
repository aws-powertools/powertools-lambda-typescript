import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { injectLambdaContext } from '../../src/middleware/middy.js';
import type { ConstructorOptions } from '../../src/types/Logger.js';

describe('Working with keys', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
    };
    vi.resetAllMocks();
  });

  it.each([
    {
      inputs: ['Hello, world!', { extra: 'parameter' }],
      expected: {
        message: 'Hello, world!',
        extra: 'parameter',
      },
      info: 'adds the message and extra keys',
    },
    {
      inputs: ['Hello, world!', { parameterOne: 'foo' }, 'bar'],
      expected: {
        message: 'Hello, world!',
        parameterOne: 'foo',
        extra: 'bar',
      },
      info: 'adds the message and multiple extra keys',
    },
    {
      inputs: [
        {
          message: 'Hello, world!',
          extra: 'parameter',
        },
      ],
      expected: {
        message: 'Hello, world!',
        extra: 'parameter',
      },
      info: 'adds the message and extra keys as an object',
    },
    {
      inputs: ['Hello, world!', new Error('Something happened!')],
      expected: {
        message: 'Hello, world!',
        error: {
          location: expect.any(String),
          message: 'Something happened!',
          name: 'Error',
          stack: expect.any(String),
        },
      },
      info: 'adds the message and error',
    },
    {
      inputs: [
        'Hello, world!',
        { myCustomErrorKey: new Error('Something happened!') },
      ],
      expected: {
        message: 'Hello, world!',
        myCustomErrorKey: {
          location: expect.any(String),
          message: 'Something happened!',
          name: 'Error',
          stack: expect.any(String),
        },
      },
      info: 'adds the message and custom error',
    },
    {
      inputs: [
        'Hello, world!',
        {
          extra: {
            value: 'CUSTOM',
            nested: {
              bool: true,
              str: 'string value',
              num: 42,
              err: new Error('Arbitrary object error'),
            },
          },
        },
      ],
      expected: {
        message: 'Hello, world!',
        extra: {
          value: 'CUSTOM',
          nested: {
            bool: true,
            str: 'string value',
            num: 42,
            err: {
              location: expect.any(String),
              message: 'Arbitrary object error',
              name: 'Error',
              stack: expect.any(String),
            },
          },
        },
      },
      info: 'adds the message and nested object',
    },
  ])('it $info when logging data', ({ inputs, expected }) => {
    // Prepare
    const logger = new Logger();

    // Act
    // @ts-expect-error - we are testing the method dynamically
    logger.info(...inputs);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(1, expect.objectContaining(expected));
  });

  it('adds the temporary keys to log messages', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.appendKeys({
      foo: 'bar',
    });
    logger.info('Hello, world!');
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(2);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'bar',
      })
    );
    expect(console.info).toHaveLoggedNth(
      2,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'bar',
      })
    );
  });

  it('overrides temporary keys when the same key is added', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.appendKeys({
      foo: 'bar',
    });
    logger.info('Hello, world!');
    logger.appendKeys({
      foo: 'baz',
    });
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(2);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'bar',
      })
    );
    expect(console.info).toHaveLoggedNth(
      2,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'baz',
      })
    );
  });

  it('adds the temporary keys and clears them when calling resetKeys()', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.appendKeys({
      foo: 'bar',
    });
    logger.info('Hello, world!');
    logger.resetKeys();
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(2);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'bar',
      })
    );
    expect(console.info).toHaveLoggedNth(
      2,
      expect.not.objectContaining({
        foo: 'bar',
      })
    );
  });

  it('adds persistent keys to log messages', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.appendPersistentKeys({
      foo: 'bar',
    });
    logger.resetKeys();
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'bar',
      })
    );
  });

  it('adds the persistent keys via constructor', () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
    });

    // Act
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'bar',
      })
    );
  });

  it('overrides persistent keys when the same key is added', () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
    });

    // Act
    logger.appendPersistentKeys({
      foo: 'baz',
    });
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'baz',
      })
    );
  });

  it('overrides temporary keys when the same key is added as persistent key', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.appendKeys({
      foo: 'bar',
    });
    logger.appendPersistentKeys({
      foo: 'baz',
    });
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'baz',
      })
    );
  });

  it('preserves previously overridden persistent keys when the same key is added as temporary key', () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
    });

    // Act
    logger.appendKeys({
      foo: 'baz',
    });
    logger.resetKeys();
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        foo: 'bar',
      })
    );
  });

  it('handles gracefully the removal of non-existing keys', () => {
    // Prepare
    const logger = new Logger();

    // Act & Assess
    expect(() => logger.removeKeys(['foo'])).not.toThrow();
  });

  it('removes a temporary key from log messages', () => {
    // Prepare
    const logger = new Logger();
    logger.appendKeys({
      foo: 'bar',
    });

    // Act
    logger.removeKeys(['foo']);
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.not.objectContaining({
        foo: 'bar',
      })
    );
  });

  it('restores the persistent key after removing it as temporary key', () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
    });

    // Act
    logger.appendKeys({
      foo: 'baz',
    });
    logger.removeKeys(['foo']);
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        foo: 'bar',
      })
    );
  });

  it('removes a persistent key from log messages', () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
    });

    // Act
    logger.removePersistentKeys(['foo']);
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.not.objectContaining({
        foo: 'bar',
      })
    );
  });

  it('restores the temporary key after removing it as persistent key', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.appendKeys({
      foo: 'bar',
    });
    logger.appendPersistentKeys({
      foo: 'baz',
    });
    logger.removePersistentKeys(['foo']);
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        foo: 'bar',
      })
    );
  });

  it('removes the temporary keys when resetState is enabled in the Middy.js middleware', async () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
    });
    const handler = middy(async (addKey: boolean) => {
      if (addKey) {
        logger.appendKeys({
          foo: 'baz',
        });
      }
      logger.info('Hello, world!');
    }).use(injectLambdaContext(logger, { resetKeys: true }));

    // Act
    await handler(true, context);
    await handler(false, context);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(2);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        foo: 'baz',
      })
    );
    expect(console.info).toHaveLoggedNth(
      2,
      expect.objectContaining({
        foo: 'bar',
      })
    );
  });

  it('removes the temporary keys when resetState is enabled in the class method decorator', async () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
    });
    class Test {
      @logger.injectLambdaContext({ resetKeys: true })
      async handler(addKey: boolean, context: Context) {
        if (addKey) {
          logger.appendKeys({
            foo: 'baz',
          });
        }
        logger.info('Hello, world!');
      }
    }
    const handler = new Test().handler;

    // Act
    await handler(true, context);
    await handler(false, context);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(2);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        foo: 'baz',
      })
    );
    expect(console.info).toHaveLoggedNth(
      2,
      expect.objectContaining({
        foo: 'bar',
      })
    );
  });

  it('propagates the persistent keys to the child logger instances', () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
    });

    // Act
    const childLogger = logger.createChild();

    // Assess
    expect(childLogger.getPersistentLogAttributes()).toEqual({
      foo: 'bar',
    });
  });

  it('includes the X-Ray trace data in the log message', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        xray_trace_id: '1-abcdef12-3456abcdef123456abcdef12',
      })
    );
  });

  it('adds persistent keys using the deprecated addPersistentLogAttributes() method', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.addPersistentLogAttributes({
      foo: 'bar',
    });

    // Assess
    expect(logger.getPersistentLogAttributes()).toEqual({
      foo: 'bar',
    });
  });

  it('removes a persistent key using the deprecated removePersistentLogAttributes() method', () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
    });

    // Act
    logger.removePersistentLogAttributes(['foo']);
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.not.objectContaining({
        foo: 'bar',
      })
    );
  });

  it('adds persistent keys using the deprecated setPersistentLogAttributes() method', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.setPersistentLogAttributes({
      foo: 'bar',
    });

    // Assess
    expect(logger).toEqual(
      expect.objectContaining({
        persistentLogAttributes: {
          foo: 'bar',
        },
      })
    );
  });

  it('logs a warning when using both the deprecated persistentLogAttributes and persistentKeys options', () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        foo: 'bar',
      },
      persistentLogAttributes: {
        bar: 'baz',
      },
    } as unknown as ConstructorOptions);

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message:
          'Both persistentLogAttributes and persistentKeys options were provided. Using persistentKeys as persistentLogAttributes is deprecated and will be removed in future releases',
      })
    );
  });

  it("doesn't overwrite standard keys when appending keys", () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.appendKeys({
      level: 'Hello, World!',
    });
    logger.info('foo');

    // Assess
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        level: 'INFO',
      })
    );
    expect(console.warn).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'The key "level" is a reserved key and will be dropped.',
      })
    );
  });

  it("doesn't overwrite standard keys when appending persistent keys", () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.appendPersistentKeys({
      timestamp: 'Hello, World!',
    });
    logger.info('foo');

    // Assess
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        timestamp: expect.not.stringMatching('Hello, World!'),
      })
    );
    expect(console.warn).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'The key "timestamp" is a reserved key and will be dropped.',
      })
    );
  });

  it("doesn't overwrite standard keys when appending keys via constructor", () => {
    // Prepare
    const logger = new Logger({
      persistentKeys: {
        sampling_rate: 'Hello, World!',
      },
    });

    // Act
    logger.info('foo');

    // Assess
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        sampling_rate: expect.not.stringMatching('Hello, World!'),
      })
    );
    expect(console.warn).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message:
          'The key "sampling_rate" is a reserved key and will be dropped.',
      })
    );
  });

  it("doesn't overwrite standard keys when passing keys to log method", () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.info(
      {
        message: 'foo',
        timestamp: 'Hello, World!',
      },
      {
        level: 'Hello, World!',
      }
    );

    // Assess
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'foo',
        timestamp: expect.not.stringMatching('Hello, World!'),
        level: 'INFO',
      })
    );
    expect(console.warn).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'The key "timestamp" is a reserved key and will be dropped.',
      })
    );
    expect(console.warn).toHaveLoggedNth(
      2,
      expect.objectContaining({
        message: 'The key "level" is a reserved key and will be dropped.',
      })
    );
  });
});
