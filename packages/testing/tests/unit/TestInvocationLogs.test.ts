/**
 * Test InvocationLogs class
 *
 * @group unit/commons/invocationLogs
 *
 */

import { TestInvocationLogs } from '../../src/TestInvocationLogs.js';

const exampleLogs = `START RequestId: c6af9ac6-7b61-11e6-9a41-93e812345678 Version: $LATEST
{"cold_start":true,"function_arn":"arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_memory_size":128,"function_name":"loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_request_id":"7f586697-238a-4c3b-9250-a5f057c1119c","level":"DEBUG","message":"This is a DEBUG log but contains the word INFO some context and persistent key","service":"logger-e2e-testing","timestamp":"2022-01-27T16:04:39.323Z","persistentKey":"works"}
{"cold_start":true,"function_arn":"arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_memory_size":128,"function_name":"loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_request_id":"7f586697-238a-4c3b-9250-a5f057c1119c","level":"INFO","message":"This is an INFO log with some context","service":"logger-e2e-testing","timestamp":"2022-01-27T16:04:39.323Z","persistentKey":"works","additionalKey":"additionalValue"}
{"cold_start":true,"function_arn":"arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_memory_size":128,"function_name":"loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_request_id":"7f586697-238a-4c3b-9250-a5f057c1119c","level":"INFO","message":"This is a second INFO log with some context","service":"logger-e2e-testing","timestamp":"2022-01-27T16:04:39.323Z","persistentKey":"works","additionalKey":"additionalValue"}
{"cold_start":true,"function_arn":"arn:aws:lambda:eu-west-1:561912387782:function:loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_memory_size":128,"function_name":"loggerMiddyStandardFeatures-c555a2ec-1121-4586-9c04-185ab36ea34c","function_request_id":"7f586697-238a-4c3b-9250-a5f057c1119c","level":"ERROR","message":"There was an error","service":"logger-e2e-testing","timestamp":"2022-01-27T16:04:39.323Z","persistentKey":"works","error":{"name":"Error","location":"/var/task/index.js:2778","message":"you cannot prevent this","stack":"Error: you cannot prevent this\\n    at testFunction (/var/task/index.js:2778:11)\\n    at runRequest (/var/task/index.js:2314:36)"}}
END RequestId: c6af9ac6-7b61-11e6-9a41-93e812345678
REPORT RequestId: c6af9ac6-7b61-11e6-9a41-93e812345678\tDuration: 2.16 ms\tBilled Duration: 3 ms\tMemory Size: 128 MB\tMax Memory Used: 57 MB\t`;

describe('Constructor', () => {
  test('it should parse base64 text correctly', () => {
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
  test('it should return true if the text appear in any logs', () => {
    const phraseInMessage = 'This is';
    expect(invocationLogs.doesAnyFunctionLogsContains(phraseInMessage)).toBe(
      true
    );
  });
  test('it should return false if the text does not appear in any logs', () => {
    const phraseNotInMessage = 'A quick brown fox jumps over the lazy dog';
    expect(invocationLogs.doesAnyFunctionLogsContains(phraseNotInMessage)).toBe(
      false
    );
  });

  test('it should return true for key in the log', () => {
    const keyInLog = 'error';
    expect(invocationLogs.doesAnyFunctionLogsContains(keyInLog)).toBe(true);
  });

  test('it should return true for a text in an error key', () => {
    const textInError = '/var/task/index.js:2778';
    expect(invocationLogs.doesAnyFunctionLogsContains(textInError)).toBe(true);
  });
  test('it should return false for the text that appears only on the ', () => {
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

  test('it should apply filter log based on the given level', () => {
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

  test('it should retrive logs of the given level only', () => {
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

  test('it should NOT return logs generated by Lambda service (e.g. START, END, and REPORT)', () => {
    const errorLogs = invocationLogs.getFunctionLogs('ERROR');
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].includes('START')).toBe(false);
    expect(errorLogs[0].includes('END')).toBe(false);
    expect(errorLogs[0].includes('REPORT')).toBe(false);
  });
});

describe('parseFunctionLog()', () => {
  test('it should return object with the correct values based on the given log', () => {
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

  test('it should throw an error if receive incorrect formatted raw log string', () => {
    const notJSONstring = 'not-json-string';
    expect(() => {
      TestInvocationLogs.parseFunctionLog(notJSONstring);
    }).toThrow(Error);
  });
});
