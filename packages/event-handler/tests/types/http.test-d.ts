import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { Router } from '../../src/http/index.js';
import type { IStore } from '../../src/store/Store.js';
import type {
  Env,
  InferResBody,
  InferResSchema,
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
    // Assess
    expectTypeOf<RequestStoreOf<AppEnv>>().toEqualTypeOf<{
      userId: string;
      isAdmin: boolean;
    }>();
  });

  it('extracts shared store type from Env', () => {
    // Assess
    expectTypeOf<SharedStoreOf<AppEnv>>().toEqualTypeOf<{
      db: string;
      config: { timeout: number };
    }>();
  });

  it('defaults to Record<string, unknown> when no store is defined', () => {
    // Assess
    expectTypeOf<RequestStoreOf<Env>>().toEqualTypeOf<
      Record<string, unknown>
    >();
    expectTypeOf<SharedStoreOf<Env>>().toEqualTypeOf<Record<string, unknown>>();
  });

  it('defaults to Record<string, unknown> when store is partial', () => {
    // Prepare
    type PartialEnv = { store: { request: { userId: string } } };

    // Assess
    expectTypeOf<RequestStoreOf<PartialEnv>>().toEqualTypeOf<{
      userId: string;
    }>();
    expectTypeOf<SharedStoreOf<PartialEnv>>().toEqualTypeOf<
      Record<string, unknown>
    >();
  });

  it('preserves backwards compatibility for RequestContext without generics', () => {
    // Prepare
    type Ctx = RequestContext;

    // Assess
    expectTypeOf<Ctx>().toEqualTypeOf<RequestContext<Env>>();
  });

  it('preserves backwards compatibility for Middleware without generics', () => {
    // Prepare
    type Mw = Middleware;

    // Assess
    expectTypeOf<Mw>().toEqualTypeOf<Middleware<Env>>();
  });

  it('preserves backwards compatibility for RouteHandler without generics', () => {
    // Prepare
    type Rh = RouteHandler;

    // Assess
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
    // Prepare
    type Ctx = RequestContext<AppEnv>;

    // Assess
    expectTypeOf<Ctx['shared']>().toEqualTypeOf<IStore<{ db: string }>>();
  });

  it('defaults shared to IStore<Record<string, unknown>> without TEnv', () => {
    // Prepare
    type Ctx = RequestContext;

    // Assess
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
    // Prepare
    type Merged = MergeEnv<[AuthEnv, FeatureEnv]>;

    // Assess
    expectTypeOf<Merged>().toEqualTypeOf<{
      store: {
        request: { userId: string } & { featureFlags: string[] };
        shared: { db: string } & { cache: Map<string, unknown> };
      };
    }>();
  });

  it('requires at least two Env types', () => {
    // Assess
    // @ts-expect-error TS2344 — single-element tuple does not satisfy [Env, Env, ...Env[]]
    type _Invalid = MergeEnv<[Env]>;
  });

  it('produces Record<string, unknown> when all envs are untyped', () => {
    // Prepare
    type Merged = MergeEnv<[Env, Env]>;

    // Assess
    expectTypeOf<Merged>().toEqualTypeOf<{
      store: {
        request: Record<string, unknown>;
        shared: Record<string, unknown>;
      };
    }>();
  });

  it('preserves typed store when merged with an untyped Env', () => {
    // Prepare
    type TypedEnv = {
      store: {
        request: { id: string };
        shared: { appName: string };
      };
    };
    type Merged = MergeEnv<[Env, TypedEnv]>;

    // Assess
    expectTypeOf<Merged>().toEqualTypeOf<{
      store: {
        request: { id: string };
        shared: { appName: string };
      };
    }>();
  });

  it('preserves typed request store when merged with shared-only Env', () => {
    // Prepare
    type SharedOnlyEnv = { store: { shared: { appName: string } } };
    type RequestOnlyEnv = { store: { request: { id: string } } };
    type Merged = MergeEnv<[SharedOnlyEnv, RequestOnlyEnv]>;

    // Assess
    expectTypeOf<Merged>().toEqualTypeOf<{
      store: {
        request: { id: string };
        shared: { appName: string };
      };
    }>();
  });
});

describe('IntersectAll', () => {
  it('intersects a tuple of record types', () => {
    // Prepare
    type Result = IntersectAll<[{ a: number }, { b: string }, { c: boolean }]>;

    // Assess
    expectTypeOf<Result>().toEqualTypeOf<
      { a: number } & { b: string } & { c: boolean }
    >();
  });

  it('returns unknown for an empty tuple', () => {
    // Prepare
    type Result = IntersectAll<[]>;

    // Assess
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
    // Prepare
    type ParentEnv = {
      store: {
        request: { userId: string; featureFlags: string[] };
        shared: { db: string; cache: Map<string, unknown> };
      };
    };
    const app = new Router<ParentEnv>();
    const authRouter = new Router<AuthEnv>();

    // Act
    app.includeRouter(authRouter);

    // Assess
    expectTypeOf(app).toEqualTypeOf<Router<ParentEnv>>();
    expectTypeOf(authRouter).toEqualTypeOf<Router<AuthEnv>>();
  });

  it('accepts an untyped Router (backward compat)', () => {
    // Prepare
    const app = new Router();
    const legacyRouter = new Router();

    // Act
    app.includeRouter(legacyRouter);

    // Assess
    expectTypeOf(app).toEqualTypeOf<Router<Env>>();
    expectTypeOf(legacyRouter).toEqualTypeOf<Router<Env>>();
  });

  it('chains includeRouter to merge disjoint envs', () => {
    // Prepare
    const authRouter = new Router<AuthEnv>();
    const featureRouter = new Router<FeatureEnv>();

    // Act
    const app = new Router()
      .includeRouter(authRouter)
      .includeRouter(featureRouter);

    // Assess
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
    // Prepare
    type AppEnv = MergeEnv<[AuthEnv, FeatureEnv]>;
    const authRouter = new Router<AuthEnv>();
    const featureRouter = new Router<FeatureEnv>();

    // Act
    const app = new Router<AppEnv>();
    app.includeRouter(authRouter);
    app.includeRouter(featureRouter);

    // Assess
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

describe('Response validation typing', () => {
  it('infers the output type for a standard response schema', () => {
    const responseSchema = z.object({ id: z.string(), name: z.string() });
    type Config = { res: { body: typeof responseSchema } };

    expectTypeOf<InferResBody<Config>>().toEqualTypeOf<{
      id: string;
      name: string;
    }>();
  });

  // passes on main, fails on your branch
  it('infers the output type for a coerced response schema', () => {
    const responseSchema = z.object({
      id: z.coerce.string(),
      name: z.string(),
    });
    type Config = { res: { body: typeof responseSchema } };

    expectTypeOf<InferResBody<Config>>().toEqualTypeOf<{
      id: unknown;
      name: string;
    }>();
  });

  it('infers the output type for a transformed response schema', () => {
    const responseSchema = z
      .object({
        id: z.number(),
        name: z.string(),
      })
      .transform((r) => ({
        ...r,
        id: String(r.id),
      }));

    type Config = { res: { body: typeof responseSchema } };

    expectTypeOf<InferResBody<Config>>().toEqualTypeOf<{
      id: number;
      name: string;
    }>();
  });

  it('rejects handler returning wrong types with a standard schema', () => {
    const app = new Router();
    const responseSchema = z.object({ id: z.string(), name: z.string() });

    app.get(
      '/users/:id',
      // @ts-expect-error - number is not assignable to string for id
      () => {
        return { id: 123, name: 'John' };
      },
      { validation: { res: { body: responseSchema } } }
    );
  });

  // fails on main, passes on your branch
  it('accepts handler returning pre-coercion types with z.coerce', () => {
    const app = new Router();
    const responseSchema = z.object({
      id: z.coerce.string(),
      name: z.string(),
    });

    app.get(
      '/users/:id',
      () => {
        return { id: 123, name: 'John' };
      },
      { validation: { res: { body: responseSchema } } }
    );
  });

  // fails on main, passes on your branch
  it('accepts handler returning a Response object with response validation', () => {
    const app = new Router();
    const responseSchema = z.object({ id: z.string(), name: z.string() });

    app.get(
      '/users/:id',
      () => {
        return Response.json({ id: '123', name: 'John' });
      },
      { validation: { res: { body: responseSchema } } }
    );
  });

  it('infers validated response body as output type for a standard schema', () => {
    const responseSchema = z.object({ id: z.string(), name: z.string() });
    type Config = { res: { body: typeof responseSchema } };

    expectTypeOf<InferResSchema<Config>>().toEqualTypeOf<{
      body: { id: string; name: string };
      headers: undefined;
    }>();
  });

  it('infers validated response body as output type for a coerced schema', () => {
    const responseSchema = z.object({
      id: z.coerce.string(),
      name: z.string(),
    });
    type Config = { res: { body: typeof responseSchema } };

    expectTypeOf<InferResSchema<Config>>().toEqualTypeOf<{
      body: { id: string; name: string };
      headers: undefined;
    }>();
  });
});
