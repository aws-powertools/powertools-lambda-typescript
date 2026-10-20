import type { IdempotencyRecordStatusValue } from '@aws-lambda-powertools/idempotency/types';

export type Request = {
  user: string;
  productId: string;
};

export type Response = {
  [key: string]: unknown;
};

export type SubscriptionResult = {
  id: string;
  productId: string;
};

export type ApiSecret = {
  apiKey: string;
  refreshToken: string;
  validUntil: number;
  restEndpoint: string;
};

export type ProviderItem = {
  validation?: string;
  in_progress_expiration?: number;
  status: IdempotencyRecordStatusValue;
  data: string;
};
