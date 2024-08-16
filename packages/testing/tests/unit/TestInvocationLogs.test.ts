import { beforeEach, describe, expect, it } from 'vitest';
import { TestInvocationLogs } from '../../src/TestInvocationLogs.js';

const exampleLogs = `START RequestId: c6af9ac6-7b61-11e6-9a41-93e812345678 Version: $LATEST
{"cold_start":true,"function_arn":"arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_memory_size":128,"function_name":"loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_request_id":"7f586697-238a-4c3b-9250-a5f057c1119c","level":"DEBUG","message":"This is a DEBUG log but contains the word INFO some context and persistent key","service":"logger-e2e-testing","timestamp":"2022-01-27T16:04:39.323Z","persistentKey":"works"}
{"cold_start":true,"function_arn":"arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_memory_size":128,"function_name":"loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_request_id":"7f586697-238a-4c3b-9250-a5f057c1119c","level":"INFO","message":"This is an INFO log with some context","service":"logger-e2e-testing","timestamp":"2022-01-27T16:04:39.323Z","persistentKey":"works","additionalKey":"additionalValue"}
{"cold_start":true,"function_arn":"arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_memory_size":128,"function_name":"loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_request_id":"7f586697-238a-4c3b-9250-a5f057c1119c","level":"INFO","message":"This is a second INFO log with some context","service":"logger-e2e-testing","timestamp":"2022-01-27T16:04:39.323Z","persistentKey":"works","additionalKey":"additionalValue"}
{"cold_start":true,"function_arn":"arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_memory_size":128,"function_name":"loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_request_id":"7f586697-238a-4c3b-9250-a5f057c1119c","level":"ERROR","message":"There was an error","service":"logger-e2e-testing","timestamp":"2022-01-27T16:04:39.323Z","persistentKey":"works","error":{"name":"Error","location":"/var/task/index.js:2778","message":"you cannot prevent this","stack":"Error: you cannot prevent this\\n    at testFunction (/var/task/index.js:2778:11)\\n    at runRequest (/var/task/index.js:2314:36)"}}
END RequestId: c6af9ac6-7b61-11e6-9a41-93e812345678
REPORT RequestId: c6af9ac6-7b61-11e6-9a41-93e812345678\tDuration: 2.16 ms\tBilled Duration: 3 ms\tMemory Size: 128 MB\tMax Memory Used: 57 MB\t`;

describe('Constructor', () => {
  it('parses base64 text correctly', () => {
    const invocationLogs = new TestInvocationLogs(
      Buffer.from(exampleLogs).toString('base64')
    );
    expect(invocationLogs.getFunctionLogs('DEBUG').length).toBe(1);
    expect(invocationLogs.getFunctionLogs('INFO').length).toBe(2);
    expect(invocationLogs.getFunctionLogs('ERROR').length).toBe(1);
  });
});

describe('doesAnyFunctionLogsContains()', () => {
  let invocationLogs: TestInvocationLogs;

  beforeEach(() => {
    invocationLogs = new TestInvocationLogs(
      Buffer.from(exampleLogs).toString('base64')
    );
  });
  it('returns true if the text appear in any of the logs', () => {
    const phraseInMessage = 'This is';
    expect(invocationLogs.doesAnyFunctionLogsContains(phraseInMessage)).toBe(
      true
    );
  });
  it('returns false if the text does not appear anywhere', () => {
    const phraseNotInMessage = 'A quick brown fox jumps over the lazy dog';
    expect(invocationLogs.doesAnyFunctionLogsContains(phraseNotInMessage)).toBe(
      false
    );
  });

  it('returns true if the provided key appears in any of the logs', () => {
    const keyInLog = 'error';
    expect(invocationLogs.doesAnyFunctionLogsContains(keyInLog)).toBe(true);
  });

  it('returns true it the provided text appears in an error key within the logs', () => {
    const textInError = '/var/task/index.js:2778';
    expect(invocationLogs.doesAnyFunctionLogsContains(textInError)).toBe(true);
  });
  it('excludes the report logs from the search', () => {
    const textInStartLine = 'Version: $LATEST';
    const textInEndLine = 'END RequestId';
    const textInReportLine = 'Billed Duration';
    expect(invocationLogs.doesAnyFunctionLogsContains(textInStartLine)).toBe(
      false
    );
    expect(invocationLogs.doesAnyFunctionLogsContains(textInEndLine)).toBe(
      false
    );
    expect(invocationLogs.doesAnyFunctionLogsContains(textInReportLine)).toBe(
      false
    );
  });

  it('filters log based on the given level', () => {
    const debugLogHasWordINFO = invocationLogs.doesAnyFunctionLogsContains(
      'INFO',
      'DEBUG'
    );
    expect(debugLogHasWordINFO).toBe(true);

    const infoLogHasWordINFO = invocationLogs.doesAnyFunctionLogsContains(
      'INFO',
      'INFO'
    );
    expect(infoLogHasWordINFO).toBe(true);

    const errorLogHasWordINFO = invocationLogs.doesAnyFunctionLogsContains(
      'INFO',
      'ERROR'
    );
    expect(errorLogHasWordINFO).toBe(false);
  });
});

describe('getFunctionLogs()', () => {
  let invocationLogs: TestInvocationLogs;

  beforeEach(() => {
    invocationLogs = new TestInvocationLogs(
      Buffer.from(exampleLogs).toString('base64')
    );
  });

  it('retrives logs of the given level only', () => {
    const infoLogs = invocationLogs.getFunctionLogs('INFO');
    expect(infoLogs.length).toBe(2);
    expect(infoLogs[0].includes('INFO')).toBe(true);
    expect(infoLogs[1].includes('INFO')).toBe(true);
    expect(infoLogs[0].includes('ERROR')).toBe(false);
    expect(infoLogs[1].includes('ERROR')).toBe(false);

    const errorLogs = invocationLogs.getFunctionLogs('ERROR');
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].includes('INFO')).toBe(false);
    expect(errorLogs[0].includes('ERROR')).toBe(true);
  });

  it("doesn't return logs generated by Lambda service (e.g. START, END, and REPORT)", () => {
    const errorLogs = invocationLogs.getFunctionLogs('ERROR');
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].includes('START')).toBe(false);
    expect(errorLogs[0].includes('END')).toBe(false);
    expect(errorLogs[0].includes('REPORT')).toBe(false);
  });
});

describe('parseFunctionLog()', () => {
  it('returns an object with the correct values based on the given log', () => {
    const rawLogStr =
      '{"cold_start":true,"function_arn":"arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_memory_size":128,"function_name":"loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_request_id":"7f586697-238a-4c3b-9250-a5f057c1119c","level":"DEBUG","message":"This is a DEBUG log but contains the word INFO some context and persistent key","service":"logger-e2e-testing","timestamp":"2022-01-27T16:04:39.323Z","persistentKey":"works"}';

    const logObj = TestInvocationLogs.parseFunctionLog(rawLogStr);
    expect(logObj).toStrictEqual({
      cold_start: true,
      function_arn:
        'arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c',
      function_memory_size: 128,
      function_name:
        'loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c',
      function_request_id: '7f586697-238a-4c3b-9250-a5f057c1119c',
      level: 'DEBUG',
      message:
        'This is a DEBUG log but contains the word INFO some context and persistent key',
      service: 'logger-e2e-testing',
      timestamp: '2022-01-27T16:04:39.323Z',
      persistentKey: 'works',
    });
  });

  it('throws an error if receive incorrect formatted raw log string', () => {
    const notJSONstring = 'not-json-string';
    expect(() => {
      TestInvocationLogs.parseFunctionLog(notJSONstring);
    }).toThrow(Error);
  });
});
