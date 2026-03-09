import { describe, expectTypeOf, it } from 'vitest';
import type { IStore } from '../../src/Store.js';
import type {
  Env,
  Middleware,
  RequestContext,
  RequestStoreOf,
  RouteHandler,
  SharedStoreOf,
} from '../../src/types/http.js';

describe('Store types', () => {
  type AppEnv = {
    store: {
      request: { userId: string; isAdmin: boolean };
      shared: { db: string; config: { timeout: number } };
    };
  };

  it('extracts request store type from Env', () => {
    expectTypeOf<RequestStoreOf<AppEnv>>().toEqualTypeOf<{
      userId: string;
      isAdmin: boolean;
    }>();
  });

  it('extracts shared store type from Env', () => {
    expectTypeOf<SharedStoreOf<AppEnv>>().toEqualTypeOf<{
      db: string;
      config: { timeout: number };
    }>();
  });

  it('defaults to Record<string, unknown> when no store is defined', () => {
    expectTypeOf<RequestStoreOf<Env>>().toEqualTypeOf<
      Record<string, unknown>
    >();
    expectTypeOf<SharedStoreOf<Env>>().toEqualTypeOf<Record<string, unknown>>();
  });

  it('defaults to Record<string, unknown> when store is partial', () => {
    type PartialEnv = { store: { request: { userId: string } } };
    expectTypeOf<RequestStoreOf<PartialEnv>>().toEqualTypeOf<{
      userId: string;
    }>();
    expectTypeOf<SharedStoreOf<PartialEnv>>().toEqualTypeOf<
      Record<string, unknown>
    >();
  });

  it('preserves backwards compatibility for RequestContext without generics', () => {
    type Ctx = RequestContext;
    expectTypeOf<Ctx>().toEqualTypeOf<RequestContext<Env>>();
  });

  it('preserves backwards compatibility for Middleware without generics', () => {
    type Mw = Middleware;
    expectTypeOf<Mw>().toEqualTypeOf<Middleware<Env>>();
  });

  it('preserves backwards compatibility for RouteHandler without generics', () => {
    type Rh = RouteHandler;
    expectTypeOf<Rh>().toEqualTypeOf<RouteHandler<Env>>();
  });
});

describe('RequestContext store properties', () => {
  type AppEnv = {
    store: {
      request: { userId: string; isAdmin: boolean };
      shared: { db: string };
    };
  };

  it('exposes shared as IStore typed to SharedStoreOf<TEnv>', () => {
    type Ctx = RequestContext<AppEnv>;
    expectTypeOf<Ctx['shared']>().toEqualTypeOf<IStore<{ db: string }>>();
  });

  it('defaults shared to IStore<Record<string, unknown>> without TEnv', () => {
    type Ctx = RequestContext;
    expectTypeOf<Ctx['shared']>().toEqualTypeOf<
      IStore<Record<string, unknown>>
    >();
  });
});
