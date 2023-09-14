import { IdempotencyRecordStatusValue } from '@aws-lambda-powertools/idempotency/types';

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

export type MomentoApiSecret = {
  apiKey: string;
  refreshToken: string;
  validUntil: number;
  restEndpoint: string;
};

export type Item = {
  validation?: string;
  in_progress_expiration?: string;
  status: IdempotencyRecordStatusValue;
  data: string;
};
