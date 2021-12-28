import { ConfigServiceInterface } from '.';

abstract class ConfigService implements ConfigServiceInterface {

  public abstract get(name: string): string;
  public abstract getNamespace(): string;
  public abstract getService(): string;

}

export {
  ConfigService,
};