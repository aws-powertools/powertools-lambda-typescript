import { Metrics } from '../../src/';
import { MetricUnits } from '../../types';
import { populateEnvironmentVariables } from '../helpers';

describe('Metrics', () => {

  const originalEnvironmentVariables = process.env;

  // beforeEach(() => {
  // });

  beforeAll(() => {
    populateEnvironmentVariables();
  });

  afterAll(() => {
    process.env = originalEnvironmentVariables;
  });

  test('should log service dimension correctly when passed', () => {
    const serviceName = 'testing_name';
    const metrics = new Metrics({ namespace: 'test', service: serviceName });
    metrics.addMetric('test_name', MetricUnits.Seconds, 14);
    const loggedData = metrics.serializeMetrics();
    expect(loggedData.service).toEqual(serviceName);
    expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
    expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0][0]).toEqual('service');
  });

  // test('should log service dimension correctly from env var when not passed', () => {
  //   const serviceName = 'hello-world';
  //   const metrics = new Metrics({ namespace: 'test' });
  //   metrics.addMetric('test_name', MetricUnits.Seconds, 10);
  //   const loggedData = metrics.serializeMetrics();
  //   expect(loggedData.service).toEqual(serviceName);
  // });
  //
  // test('Additional dimensions should be added correctly', () => {
  //   const additionalDimension = { name: 'metric2', value: 'metic2Value' };
  //   const metrics = new Metrics({ namespace: 'test' });
  //   metrics.addMetric('test_name', MetricUnits.Seconds, 10);
  //   metrics.addDimension(additionalDimension.name, additionalDimension.value);
  //   const loggedData = metrics.serializeMetrics();
  //   expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(2);
  //   expect(loggedData[additionalDimension.name]).toEqual(additionalDimension.value);
  // });
  //
  // test('Metadata should be added correctly', () => {
  //   const metadataItem = { name: 'metaName', value: 'metaValue' };
  //   const metrics = new Metrics({ namespace: 'test' });
  //   metrics.addMetric('test_name', MetricUnits.Seconds, 10);
  //   metrics.addMetadata(metadataItem.name, metadataItem.value);
  //   const loggedData = metrics.serializeMetrics();
  //   expect(loggedData[metadataItem.name]).toEqual(metadataItem.value);
  // });

});