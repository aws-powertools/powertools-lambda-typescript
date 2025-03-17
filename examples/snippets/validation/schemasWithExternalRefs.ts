const defsSchema = {
  $id: 'http://example.com/schemas/defs.json',
  definitions: {
    int: { type: 'integer' },
    str: { type: 'string' },
  },
} as const;

const inboundSchema = {
  $id: 'http://example.com/schemas/inbound.json',
  type: 'object',
  properties: {
    userId: { $ref: 'defs.json#/definitions/str' },
  },
  required: ['userId'],
} as const;

type InboundSchema = {
  userId: string;
};

const outboundSchema = {
  $id: 'http://example.com/schemas/outbound.json',
  type: 'object',
  properties: {
    body: { $ref: 'defs.json#/definitions/str' },
    statusCode: { $ref: 'defs.json#/definitions/int' },
  },
  required: ['body', 'statusCode'],
} as const;

type OutboundSchema = {
  body: string;
  statusCode: number;
};

export {
  defsSchema,
  inboundSchema,
  outboundSchema,
  type InboundSchema,
  type OutboundSchema,
};
