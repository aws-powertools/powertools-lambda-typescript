import { describe, expectTypeOf, it } from 'vitest';
import { Router } from '../../src/http/index.js';
import type { IStore } from '../../src/Store.js';
import type {
  Env,
  IntersectAll,
  MergeEnv,
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

describe('MergeEnv', () => {
  type AuthEnv = {
    store: {
      request: { userId: string };
      shared: { db: string };
    };
  };

  type FeatureEnv = {
    store: {
      request: { featureFlags: string[] };
      shared: { cache: Map<string, unknown> };
    };
  };

  it('intersects request and shared stores from two envs', () => {
    type Merged = MergeEnv<[AuthEnv, FeatureEnv]>;
    expectTypeOf<Merged>().toEqualTypeOf<{
      store: {
        request: { userId: string } & { featureFlags: string[] };
        shared: { db: string } & { cache: Map<string, unknown> };
      };
    }>();
  });

  it('produces Record<string, unknown> for a single bare Env', () => {
    type Merged = MergeEnv<[Env]>;
    expectTypeOf<Merged>().toEqualTypeOf<{
      store: {
        request: Record<string, unknown>;
        shared: Record<string, unknown>;
      };
    }>();
  });
});

describe('IntersectAll', () => {
  it('intersects a tuple of record types', () => {
    type Result = IntersectAll<[{ a: number }, { b: string }, { c: boolean }]>;
    expectTypeOf<Result>().toEqualTypeOf<
      { a: number } & { b: string } & { c: boolean }
    >();
  });

  it('returns unknown for an empty tuple', () => {
    type Result = IntersectAll<[]>;
    expectTypeOf<Result>().toEqualTypeOf<unknown>();
  });
});

describe('includeRouter typing', () => {
  type AuthEnv = {
    store: {
      request: { userId: string };
      shared: { db: string };
    };
  };

  type FeatureEnv = {
    store: {
      request: { featureFlags: string[] };
      shared: { cache: Map<string, unknown> };
    };
  };

  it('accepts a sub-router whose Env is a subset of the parent', () => {
    type ParentEnv = {
      store: {
        request: { userId: string; featureFlags: string[] };
        shared: { db: string; cache: Map<string, unknown> };
      };
    };
    const app = new Router<ParentEnv>();
    const authRouter = new Router<AuthEnv>();
    app.includeRouter(authRouter);
  });

  it('accepts an untyped Router (backward compat)', () => {
    const app = new Router();
    const legacyRouter = new Router();
    app.includeRouter(legacyRouter);
  });

  it('chains includeRouter to merge disjoint envs', () => {
    const authRouter = new Router<AuthEnv>();
    const featureRouter = new Router<FeatureEnv>();

    const app = new Router()
      .includeRouter(authRouter)
      .includeRouter(featureRouter);

    app.get('/test', (ctx) => {
      expectTypeOf(ctx.get('userId')).toEqualTypeOf<string | undefined>();
      expectTypeOf(ctx.get('featureFlags')).toEqualTypeOf<
        string[] | undefined
      >();
      expectTypeOf(ctx.shared.get('db')).toEqualTypeOf<string | undefined>();
      expectTypeOf(ctx.shared.get('cache')).toEqualTypeOf<
        Map<string, unknown> | undefined
      >();
      return { ok: true };
    });
  });

  it('accepts MergeEnv as upfront type on parent router', () => {
    type AppEnv = MergeEnv<[AuthEnv, FeatureEnv]>;

    const authRouter = new Router<AuthEnv>();
    const featureRouter = new Router<FeatureEnv>();

    const app = new Router<AppEnv>();
    app.includeRouter(authRouter);
    app.includeRouter(featureRouter);

    app.get('/test', (ctx) => {
      expectTypeOf(ctx.get('userId')).toEqualTypeOf<string | undefined>();
      expectTypeOf(ctx.get('featureFlags')).toEqualTypeOf<
        string[] | undefined
      >();
      expectTypeOf(ctx.shared.get('db')).toEqualTypeOf<string | undefined>();
      expectTypeOf(ctx.shared.get('cache')).toEqualTypeOf<
        Map<string, unknown> | undefined
      >();
      return { ok: true };
    });
  });
});
