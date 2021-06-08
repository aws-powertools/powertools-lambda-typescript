import { ConfigServiceInterface } from '../src/config';

type MetricsOptions = {
  customConfigService?: ConfigServiceInterface
  namespace?: string
  service?: string
};

export {
  MetricsOptions
};