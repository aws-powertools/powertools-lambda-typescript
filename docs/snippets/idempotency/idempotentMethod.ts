import { idempotentLambdaHandler } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import type { Request, Response, SubscriptionResult } from './types';