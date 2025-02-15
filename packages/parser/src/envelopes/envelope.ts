/**
 * This is a discriminator to differentiate whether an envelope returns an array or an object
 * @hidden
 */
const envelopeDiscriminator = Symbol.for('returnType');

export { envelopeDiscriminator };
