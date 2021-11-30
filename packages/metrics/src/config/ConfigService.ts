import { ConfigServiceInterface } from '.';

abstract class ConfigService implements ConfigServiceInterface {

  abstract get(name: string): string;
  abstract getNamespace(): string;
  abstract getService(): string;

}

export {
  ConfigService,
};