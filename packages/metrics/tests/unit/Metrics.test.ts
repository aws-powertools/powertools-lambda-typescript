import {populateEnvironmentVariables} from "../helpers";
import { Metrics } from "../../src/"

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Logger', () => {

  const originalEnvironmentVariables = process.env;

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  beforeAll(() => {
    populateEnvironmentVariables();
  });

  afterAll(() => {
    process.env = originalEnvironmentVariables;
  });

  test('should fail', () => {
    new Metrics({ namespace: 'test' });

  });
});