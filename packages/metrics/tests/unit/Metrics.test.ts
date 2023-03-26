/**
 * Test Metrics class
 *
 * @group unit/metrics/class
 */

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Class: Metrics', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  beforeAll(() => {
    process.env = { ...ENVIRONMENT_VARIABLES };
  });
});
