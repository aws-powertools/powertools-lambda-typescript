/**
 * The "descriptor" of decorator should always have "value" field.
 * If not, the transpiler will add if/else statement and a branch coverage will be missed.
 * It doesn't make sense to add a test case when descriptor doesn't have value.
 */
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type TypedPropertyDescriptorWithValue = WithRequired<TypedPropertyDescriptor<Promise<unknown>>, 'value'>;

export {
  TypedPropertyDescriptorWithValue as TypedPropertyDescriptorWithApply,
};