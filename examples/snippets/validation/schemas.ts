const inboundSchema = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
    },
  },
  required: ['userId'],
} as const;

type InboundSchema = {
  userId: string;
};

const outboundSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'string',
    },
    statusCode: {
      type: 'number',
    },
  },
  required: ['body', 'statusCode'],
} as const;

type OutboundSchema = {
  body: string;
  statusCode: number;
};

export {
  inboundSchema,
  outboundSchema,
  type InboundSchema,
  type OutboundSchema,
};
