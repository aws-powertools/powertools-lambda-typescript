import { expect, it, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';

vi.hoisted(() => {
  process.env.POWERTOOLS_DEV = 'true';
});

it('does not overwrite via appendKeys', () => {
  const logger = new Logger({
    logLevel: 'DEBUG',
  });
  const debugSpy = vi.spyOn(console, 'debug');
  const warnSpy = vi.spyOn(console, 'warn');

  logger.appendKeys({
    level: 'Hello, World!',
  });

  logger.debug('stuff');

  const log = JSON.parse(debugSpy.mock.calls[0][0]);
  expect(log).toStrictEqual(
    expect.objectContaining({
      level: 'DEBUG',
    })
  );
  expect(warnSpy).toHaveBeenCalledTimes(1);
  const warn = JSON.parse(warnSpy.mock.calls[0][0]);
  expect(warn).toStrictEqual(
    expect.objectContaining({
      message: 'The key "level" is a reserved key and will be dropped.',
    })
  );
});

it('does not overwrite via appendPersistentKeys', () => {
  const logger = new Logger({
    logLevel: 'DEBUG',
  });
  const debugSpy = vi.spyOn(console, 'debug');
  const warnSpy = vi.spyOn(console, 'warn');

  logger.appendPersistentKeys({
    level: 'Hello, World!',
  });

  logger.debug('stuff');

  const log = JSON.parse(debugSpy.mock.calls[0][0]);
  expect(log).toStrictEqual(
    expect.objectContaining({
      level: 'DEBUG',
    })
  );
  expect(warnSpy).toHaveBeenCalledTimes(1);
  const warn = JSON.parse(warnSpy.mock.calls[0][0]);
  expect(warn).toStrictEqual(
    expect.objectContaining({
      message: 'The key "level" is a reserved key and will be dropped.',
    })
  );
});

it('does not overwrite via constructor keys', () => {
  const debugSpy = vi.spyOn(console, 'debug');
  const warnSpy = vi.spyOn(console, 'warn');
  const logger = new Logger({
    logLevel: 'DEBUG',
    persistentKeys: {
      level: 'Hello, World!',
    },
  });

  logger.debug('stuff');

  const log = JSON.parse(debugSpy.mock.calls[0][0]);
  expect(log).toStrictEqual(
    expect.objectContaining({
      level: 'DEBUG',
    })
  );
  expect(warnSpy).toHaveBeenCalledTimes(1);
  const warn = JSON.parse(warnSpy.mock.calls[0][0]);
  expect(warn).toStrictEqual(
    expect.objectContaining({
      message: 'The key "level" is a reserved key and will be dropped.',
    })
  );
});

it('does not overwrite via extra keys debug', () => {
  const debugSpy = vi.spyOn(console, 'debug');
  const warnSpy = vi.spyOn(console, 'warn');
  const logger = new Logger({
    logLevel: 'DEBUG',
  });

  logger.debug('stuff', {
    level: 'Hello, World!',
    timestamp: 'foo',
    message: 'bar',
  });

  const log = JSON.parse(debugSpy.mock.calls[0][0]);
  expect(log).toStrictEqual(
    expect.objectContaining({
      level: 'DEBUG',
      timestamp: expect.not.stringMatching('foo'),
      message: 'stuff',
    })
  );
  expect(warnSpy).toHaveBeenCalledTimes(3);
  const warn = JSON.parse(warnSpy.mock.calls[0][0]);
  expect(warn).toStrictEqual(
    expect.objectContaining({
      message: 'The key "level" is a reserved key and will be dropped.',
    })
  );
});

it('does not overwrite via main', () => {
  const debugSpy = vi.spyOn(console, 'debug');
  const warnSpy = vi.spyOn(console, 'warn');
  const logger = new Logger({
    logLevel: 'DEBUG',
  });

  logger.debug({
    level: 'Hello, World!',
    timestamp: 'foo',
    message: 'bar',
  });

  const log = JSON.parse(debugSpy.mock.calls[0][0]);
  expect(log).toStrictEqual(
    expect.objectContaining({
      level: 'DEBUG',
      timestamp: expect.not.stringMatching('foo'),
      message: 'bar',
    })
  );
  expect(warnSpy).toHaveBeenCalledTimes(2);
  const warn = JSON.parse(warnSpy.mock.calls[0][0]);
  expect(warn).toStrictEqual(
    expect.objectContaining({
      message: 'The key "level" is a reserved key and will be dropped.',
    })
  );
});

it('does not overwrite via extra keys info', () => {
  const logSpy = vi.spyOn(console, 'info');
  const warnSpy = vi.spyOn(console, 'warn');
  const logger = new Logger({
    logLevel: 'DEBUG',
  });

  logger.info('stuff', {
    level: 'Hello, World!',
    timestamp: 'foo',
    message: 'bar',
  });

  const log = JSON.parse(logSpy.mock.calls[0][0]);
  expect(log).toStrictEqual(
    expect.objectContaining({
      level: 'INFO',
      timestamp: expect.not.stringMatching('foo'),
      message: 'stuff',
    })
  );
  expect(warnSpy).toHaveBeenCalledTimes(3);
  const warn = JSON.parse(warnSpy.mock.calls[0][0]);
  expect(warn).toStrictEqual(
    expect.objectContaining({
      message: 'The key "level" is a reserved key and will be dropped.',
    })
  );
});
