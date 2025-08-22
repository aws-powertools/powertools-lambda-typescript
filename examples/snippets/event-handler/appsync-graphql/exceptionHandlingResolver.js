import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'Invoke',
    payload: ctx,
  };
}

export function response(ctx) {
  if (ctx.result.error) {
    return util.error(ctx.result.error.message, ctx.result.error.type);
  }
  return ctx.result;
}
