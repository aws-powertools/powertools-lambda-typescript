type Request = {
  user: string;
  email: string;
  productId: string;
};

type Response = {
  [key: string]: unknown;
};

type SubscriptionResult = {
  id: string;
};

export { Request, Response, SubscriptionResult };
