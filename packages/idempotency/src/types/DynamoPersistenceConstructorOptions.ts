type DynamoPersistenceConstructorOptions = {
  tableName: string
  keyAttr?: string
  statusAttr?: string
  expiryAttr?: string
  inProgressExpiryAttr?: string
  dataAttr?: string
};

export {
  DynamoPersistenceConstructorOptions
};