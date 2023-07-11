type Request = {
  user: string;
  productId: string;
};

type Response = {
  [key: string]: unknown;
};

type SubscriptionResult = {
  id: string;
  productId: string;
};

export { Request, Response, SubscriptionResult };
