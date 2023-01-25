type DynamoPersistenceConstructorOptions = {
  tableName: string
  keyAttr?: string
  statusAttr?: string
  expiryAttr?: string
  inProgressExpiryAttr?: string
  data_attr?: string
};

export {
  DynamoPersistenceConstructorOptions
};