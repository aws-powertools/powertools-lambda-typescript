/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const com = $root.com = (() => {

    /**
     * Namespace com.
     * @exports com
     * @namespace
     */
    const com = {};

    com.example = (function() {

        /**
         * Namespace example.
         * @memberof com
         * @namespace
         */
        const example = {};

        /**
         * PhoneType enum.
         * @name com.example.PhoneType
         * @enum {number}
         * @property {number} HOME=0 HOME value
         * @property {number} WORK=1 WORK value
         * @property {number} MOBILE=2 MOBILE value
         */
        example.PhoneType = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "HOME"] = 0;
            values[valuesById[1] = "WORK"] = 1;
            values[valuesById[2] = "MOBILE"] = 2;
            return values;
        })();

        /**
         * AccountStatus enum.
         * @name com.example.AccountStatus
         * @enum {number}
         * @property {number} ACTIVE=0 ACTIVE value
         * @property {number} INACTIVE=1 INACTIVE value
         * @property {number} SUSPENDED=2 SUSPENDED value
         */
        example.AccountStatus = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "ACTIVE"] = 0;
            values[valuesById[1] = "INACTIVE"] = 1;
            values[valuesById[2] = "SUSPENDED"] = 2;
            return values;
        })();

        example.EmailAddress = (function() {

            /**
             * Properties of an EmailAddress.
             * @memberof com.example
             * @interface IEmailAddress
             * @property {string|null} [address] EmailAddress address
             * @property {boolean|null} [verified] EmailAddress verified
             * @property {boolean|null} [primary] EmailAddress primary
             */

            /**
             * Constructs a new EmailAddress.
             * @memberof com.example
             * @classdesc Represents an EmailAddress.
             * @implements IEmailAddress
             * @constructor
             * @param {com.example.IEmailAddress=} [properties] Properties to set
             */
            function EmailAddress(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * EmailAddress address.
             * @member {string} address
             * @memberof com.example.EmailAddress
             * @instance
             */
            EmailAddress.prototype.address = "";

            /**
             * EmailAddress verified.
             * @member {boolean} verified
             * @memberof com.example.EmailAddress
             * @instance
             */
            EmailAddress.prototype.verified = false;

            /**
             * EmailAddress primary.
             * @member {boolean} primary
             * @memberof com.example.EmailAddress
             * @instance
             */
            EmailAddress.prototype.primary = false;

            /**
             * Creates a new EmailAddress instance using the specified properties.
             * @function create
             * @memberof com.example.EmailAddress
             * @static
             * @param {com.example.IEmailAddress=} [properties] Properties to set
             * @returns {com.example.EmailAddress} EmailAddress instance
             */
            EmailAddress.create = function create(properties) {
                return new EmailAddress(properties);
            };

            /**
             * Encodes the specified EmailAddress message. Does not implicitly {@link com.example.EmailAddress.verify|verify} messages.
             * @function encode
             * @memberof com.example.EmailAddress
             * @static
             * @param {com.example.IEmailAddress} message EmailAddress message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EmailAddress.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.address != null && Object.hasOwnProperty.call(message, "address"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.address);
                if (message.verified != null && Object.hasOwnProperty.call(message, "verified"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.verified);
                if (message.primary != null && Object.hasOwnProperty.call(message, "primary"))
                    writer.uint32(/* id 3, wireType 0 =*/24).bool(message.primary);
                return writer;
            };

            /**
             * Encodes the specified EmailAddress message, length delimited. Does not implicitly {@link com.example.EmailAddress.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.example.EmailAddress
             * @static
             * @param {com.example.IEmailAddress} message EmailAddress message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EmailAddress.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an EmailAddress message from the specified reader or buffer.
             * @function decode
             * @memberof com.example.EmailAddress
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.example.EmailAddress} EmailAddress
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EmailAddress.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.example.EmailAddress();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.address = reader.string();
                            break;
                        }
                    case 2: {
                            message.verified = reader.bool();
                            break;
                        }
                    case 3: {
                            message.primary = reader.bool();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an EmailAddress message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.example.EmailAddress
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.example.EmailAddress} EmailAddress
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EmailAddress.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an EmailAddress message.
             * @function verify
             * @memberof com.example.EmailAddress
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            EmailAddress.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.address != null && message.hasOwnProperty("address"))
                    if (!$util.isString(message.address))
                        return "address: string expected";
                if (message.verified != null && message.hasOwnProperty("verified"))
                    if (typeof message.verified !== "boolean")
                        return "verified: boolean expected";
                if (message.primary != null && message.hasOwnProperty("primary"))
                    if (typeof message.primary !== "boolean")
                        return "primary: boolean expected";
                return null;
            };

            /**
             * Creates an EmailAddress message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.example.EmailAddress
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.example.EmailAddress} EmailAddress
             */
            EmailAddress.fromObject = function fromObject(object) {
                if (object instanceof $root.com.example.EmailAddress)
                    return object;
                let message = new $root.com.example.EmailAddress();
                if (object.address != null)
                    message.address = String(object.address);
                if (object.verified != null)
                    message.verified = Boolean(object.verified);
                if (object.primary != null)
                    message.primary = Boolean(object.primary);
                return message;
            };

            /**
             * Creates a plain object from an EmailAddress message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.example.EmailAddress
             * @static
             * @param {com.example.EmailAddress} message EmailAddress
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            EmailAddress.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.address = "";
                    object.verified = false;
                    object.primary = false;
                }
                if (message.address != null && message.hasOwnProperty("address"))
                    object.address = message.address;
                if (message.verified != null && message.hasOwnProperty("verified"))
                    object.verified = message.verified;
                if (message.primary != null && message.hasOwnProperty("primary"))
                    object.primary = message.primary;
                return object;
            };

            /**
             * Converts this EmailAddress to JSON.
             * @function toJSON
             * @memberof com.example.EmailAddress
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            EmailAddress.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for EmailAddress
             * @function getTypeUrl
             * @memberof com.example.EmailAddress
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            EmailAddress.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.example.EmailAddress";
            };

            return EmailAddress;
        })();

        example.Address = (function() {

            /**
             * Properties of an Address.
             * @memberof com.example
             * @interface IAddress
             * @property {string|null} [street] Address street
             * @property {string|null} [city] Address city
             * @property {string|null} [state] Address state
             * @property {string|null} [country] Address country
             * @property {string|null} [zipCode] Address zipCode
             */

            /**
             * Constructs a new Address.
             * @memberof com.example
             * @classdesc Represents an Address.
             * @implements IAddress
             * @constructor
             * @param {com.example.IAddress=} [properties] Properties to set
             */
            function Address(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Address street.
             * @member {string} street
             * @memberof com.example.Address
             * @instance
             */
            Address.prototype.street = "";

            /**
             * Address city.
             * @member {string} city
             * @memberof com.example.Address
             * @instance
             */
            Address.prototype.city = "";

            /**
             * Address state.
             * @member {string} state
             * @memberof com.example.Address
             * @instance
             */
            Address.prototype.state = "";

            /**
             * Address country.
             * @member {string} country
             * @memberof com.example.Address
             * @instance
             */
            Address.prototype.country = "";

            /**
             * Address zipCode.
             * @member {string} zipCode
             * @memberof com.example.Address
             * @instance
             */
            Address.prototype.zipCode = "";

            /**
             * Creates a new Address instance using the specified properties.
             * @function create
             * @memberof com.example.Address
             * @static
             * @param {com.example.IAddress=} [properties] Properties to set
             * @returns {com.example.Address} Address instance
             */
            Address.create = function create(properties) {
                return new Address(properties);
            };

            /**
             * Encodes the specified Address message. Does not implicitly {@link com.example.Address.verify|verify} messages.
             * @function encode
             * @memberof com.example.Address
             * @static
             * @param {com.example.IAddress} message Address message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Address.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.street != null && Object.hasOwnProperty.call(message, "street"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.street);
                if (message.city != null && Object.hasOwnProperty.call(message, "city"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.city);
                if (message.state != null && Object.hasOwnProperty.call(message, "state"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.state);
                if (message.country != null && Object.hasOwnProperty.call(message, "country"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.country);
                if (message.zipCode != null && Object.hasOwnProperty.call(message, "zipCode"))
                    writer.uint32(/* id 5, wireType 2 =*/42).string(message.zipCode);
                return writer;
            };

            /**
             * Encodes the specified Address message, length delimited. Does not implicitly {@link com.example.Address.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.example.Address
             * @static
             * @param {com.example.IAddress} message Address message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Address.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Address message from the specified reader or buffer.
             * @function decode
             * @memberof com.example.Address
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.example.Address} Address
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Address.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.example.Address();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.street = reader.string();
                            break;
                        }
                    case 2: {
                            message.city = reader.string();
                            break;
                        }
                    case 3: {
                            message.state = reader.string();
                            break;
                        }
                    case 4: {
                            message.country = reader.string();
                            break;
                        }
                    case 5: {
                            message.zipCode = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Address message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.example.Address
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.example.Address} Address
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Address.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Address message.
             * @function verify
             * @memberof com.example.Address
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Address.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.street != null && message.hasOwnProperty("street"))
                    if (!$util.isString(message.street))
                        return "street: string expected";
                if (message.city != null && message.hasOwnProperty("city"))
                    if (!$util.isString(message.city))
                        return "city: string expected";
                if (message.state != null && message.hasOwnProperty("state"))
                    if (!$util.isString(message.state))
                        return "state: string expected";
                if (message.country != null && message.hasOwnProperty("country"))
                    if (!$util.isString(message.country))
                        return "country: string expected";
                if (message.zipCode != null && message.hasOwnProperty("zipCode"))
                    if (!$util.isString(message.zipCode))
                        return "zipCode: string expected";
                return null;
            };

            /**
             * Creates an Address message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.example.Address
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.example.Address} Address
             */
            Address.fromObject = function fromObject(object) {
                if (object instanceof $root.com.example.Address)
                    return object;
                let message = new $root.com.example.Address();
                if (object.street != null)
                    message.street = String(object.street);
                if (object.city != null)
                    message.city = String(object.city);
                if (object.state != null)
                    message.state = String(object.state);
                if (object.country != null)
                    message.country = String(object.country);
                if (object.zipCode != null)
                    message.zipCode = String(object.zipCode);
                return message;
            };

            /**
             * Creates a plain object from an Address message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.example.Address
             * @static
             * @param {com.example.Address} message Address
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Address.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.street = "";
                    object.city = "";
                    object.state = "";
                    object.country = "";
                    object.zipCode = "";
                }
                if (message.street != null && message.hasOwnProperty("street"))
                    object.street = message.street;
                if (message.city != null && message.hasOwnProperty("city"))
                    object.city = message.city;
                if (message.state != null && message.hasOwnProperty("state"))
                    object.state = message.state;
                if (message.country != null && message.hasOwnProperty("country"))
                    object.country = message.country;
                if (message.zipCode != null && message.hasOwnProperty("zipCode"))
                    object.zipCode = message.zipCode;
                return object;
            };

            /**
             * Converts this Address to JSON.
             * @function toJSON
             * @memberof com.example.Address
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Address.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Address
             * @function getTypeUrl
             * @memberof com.example.Address
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Address.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.example.Address";
            };

            return Address;
        })();

        example.PhoneNumber = (function() {

            /**
             * Properties of a PhoneNumber.
             * @memberof com.example
             * @interface IPhoneNumber
             * @property {string|null} [number] PhoneNumber number
             * @property {com.example.PhoneType|null} [type] PhoneNumber type
             */

            /**
             * Constructs a new PhoneNumber.
             * @memberof com.example
             * @classdesc Represents a PhoneNumber.
             * @implements IPhoneNumber
             * @constructor
             * @param {com.example.IPhoneNumber=} [properties] Properties to set
             */
            function PhoneNumber(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PhoneNumber number.
             * @member {string} number
             * @memberof com.example.PhoneNumber
             * @instance
             */
            PhoneNumber.prototype.number = "";

            /**
             * PhoneNumber type.
             * @member {com.example.PhoneType} type
             * @memberof com.example.PhoneNumber
             * @instance
             */
            PhoneNumber.prototype.type = 0;

            /**
             * Creates a new PhoneNumber instance using the specified properties.
             * @function create
             * @memberof com.example.PhoneNumber
             * @static
             * @param {com.example.IPhoneNumber=} [properties] Properties to set
             * @returns {com.example.PhoneNumber} PhoneNumber instance
             */
            PhoneNumber.create = function create(properties) {
                return new PhoneNumber(properties);
            };

            /**
             * Encodes the specified PhoneNumber message. Does not implicitly {@link com.example.PhoneNumber.verify|verify} messages.
             * @function encode
             * @memberof com.example.PhoneNumber
             * @static
             * @param {com.example.IPhoneNumber} message PhoneNumber message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PhoneNumber.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.number != null && Object.hasOwnProperty.call(message, "number"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.number);
                if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
                return writer;
            };

            /**
             * Encodes the specified PhoneNumber message, length delimited. Does not implicitly {@link com.example.PhoneNumber.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.example.PhoneNumber
             * @static
             * @param {com.example.IPhoneNumber} message PhoneNumber message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PhoneNumber.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PhoneNumber message from the specified reader or buffer.
             * @function decode
             * @memberof com.example.PhoneNumber
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.example.PhoneNumber} PhoneNumber
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PhoneNumber.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.example.PhoneNumber();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.number = reader.string();
                            break;
                        }
                    case 2: {
                            message.type = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a PhoneNumber message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.example.PhoneNumber
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.example.PhoneNumber} PhoneNumber
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PhoneNumber.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PhoneNumber message.
             * @function verify
             * @memberof com.example.PhoneNumber
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PhoneNumber.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.number != null && message.hasOwnProperty("number"))
                    if (!$util.isString(message.number))
                        return "number: string expected";
                if (message.type != null && message.hasOwnProperty("type"))
                    switch (message.type) {
                    default:
                        return "type: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                return null;
            };

            /**
             * Creates a PhoneNumber message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.example.PhoneNumber
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.example.PhoneNumber} PhoneNumber
             */
            PhoneNumber.fromObject = function fromObject(object) {
                if (object instanceof $root.com.example.PhoneNumber)
                    return object;
                let message = new $root.com.example.PhoneNumber();
                if (object.number != null)
                    message.number = String(object.number);
                switch (object.type) {
                default:
                    if (typeof object.type === "number") {
                        message.type = object.type;
                        break;
                    }
                    break;
                case "HOME":
                case 0:
                    message.type = 0;
                    break;
                case "WORK":
                case 1:
                    message.type = 1;
                    break;
                case "MOBILE":
                case 2:
                    message.type = 2;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a PhoneNumber message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.example.PhoneNumber
             * @static
             * @param {com.example.PhoneNumber} message PhoneNumber
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PhoneNumber.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.number = "";
                    object.type = options.enums === String ? "HOME" : 0;
                }
                if (message.number != null && message.hasOwnProperty("number"))
                    object.number = message.number;
                if (message.type != null && message.hasOwnProperty("type"))
                    object.type = options.enums === String ? $root.com.example.PhoneType[message.type] === undefined ? message.type : $root.com.example.PhoneType[message.type] : message.type;
                return object;
            };

            /**
             * Converts this PhoneNumber to JSON.
             * @function toJSON
             * @memberof com.example.PhoneNumber
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PhoneNumber.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PhoneNumber
             * @function getTypeUrl
             * @memberof com.example.PhoneNumber
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PhoneNumber.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.example.PhoneNumber";
            };

            return PhoneNumber;
        })();

        example.CustomerProfile = (function() {

            /**
             * Properties of a CustomerProfile.
             * @memberof com.example
             * @interface ICustomerProfile
             * @property {string|null} [userId] CustomerProfile userId
             * @property {string|null} [fullName] CustomerProfile fullName
             * @property {com.example.IEmailAddress|null} [email] CustomerProfile email
             * @property {number|null} [age] CustomerProfile age
             * @property {com.example.IAddress|null} [address] CustomerProfile address
             * @property {Array.<com.example.IPhoneNumber>|null} [phoneNumbers] CustomerProfile phoneNumbers
             * @property {Object.<string,string>|null} [preferences] CustomerProfile preferences
             * @property {com.example.AccountStatus|null} [accountStatus] CustomerProfile accountStatus
             */

            /**
             * Constructs a new CustomerProfile.
             * @memberof com.example
             * @classdesc Represents a CustomerProfile.
             * @implements ICustomerProfile
             * @constructor
             * @param {com.example.ICustomerProfile=} [properties] Properties to set
             */
            function CustomerProfile(properties) {
                this.phoneNumbers = [];
                this.preferences = {};
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CustomerProfile userId.
             * @member {string} userId
             * @memberof com.example.CustomerProfile
             * @instance
             */
            CustomerProfile.prototype.userId = "";

            /**
             * CustomerProfile fullName.
             * @member {string} fullName
             * @memberof com.example.CustomerProfile
             * @instance
             */
            CustomerProfile.prototype.fullName = "";

            /**
             * CustomerProfile email.
             * @member {com.example.IEmailAddress|null|undefined} email
             * @memberof com.example.CustomerProfile
             * @instance
             */
            CustomerProfile.prototype.email = null;

            /**
             * CustomerProfile age.
             * @member {number} age
             * @memberof com.example.CustomerProfile
             * @instance
             */
            CustomerProfile.prototype.age = 0;

            /**
             * CustomerProfile address.
             * @member {com.example.IAddress|null|undefined} address
             * @memberof com.example.CustomerProfile
             * @instance
             */
            CustomerProfile.prototype.address = null;

            /**
             * CustomerProfile phoneNumbers.
             * @member {Array.<com.example.IPhoneNumber>} phoneNumbers
             * @memberof com.example.CustomerProfile
             * @instance
             */
            CustomerProfile.prototype.phoneNumbers = $util.emptyArray;

            /**
             * CustomerProfile preferences.
             * @member {Object.<string,string>} preferences
             * @memberof com.example.CustomerProfile
             * @instance
             */
            CustomerProfile.prototype.preferences = $util.emptyObject;

            /**
             * CustomerProfile accountStatus.
             * @member {com.example.AccountStatus} accountStatus
             * @memberof com.example.CustomerProfile
             * @instance
             */
            CustomerProfile.prototype.accountStatus = 0;

            /**
             * Creates a new CustomerProfile instance using the specified properties.
             * @function create
             * @memberof com.example.CustomerProfile
             * @static
             * @param {com.example.ICustomerProfile=} [properties] Properties to set
             * @returns {com.example.CustomerProfile} CustomerProfile instance
             */
            CustomerProfile.create = function create(properties) {
                return new CustomerProfile(properties);
            };

            /**
             * Encodes the specified CustomerProfile message. Does not implicitly {@link com.example.CustomerProfile.verify|verify} messages.
             * @function encode
             * @memberof com.example.CustomerProfile
             * @static
             * @param {com.example.ICustomerProfile} message CustomerProfile message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CustomerProfile.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.userId);
                if (message.fullName != null && Object.hasOwnProperty.call(message, "fullName"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.fullName);
                if (message.email != null && Object.hasOwnProperty.call(message, "email"))
                    $root.com.example.EmailAddress.encode(message.email, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.age != null && Object.hasOwnProperty.call(message, "age"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.age);
                if (message.address != null && Object.hasOwnProperty.call(message, "address"))
                    $root.com.example.Address.encode(message.address, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.phoneNumbers != null && message.phoneNumbers.length)
                    for (let i = 0; i < message.phoneNumbers.length; ++i)
                        $root.com.example.PhoneNumber.encode(message.phoneNumbers[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.preferences != null && Object.hasOwnProperty.call(message, "preferences"))
                    for (let keys = Object.keys(message.preferences), i = 0; i < keys.length; ++i)
                        writer.uint32(/* id 7, wireType 2 =*/58).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 2 =*/18).string(message.preferences[keys[i]]).ldelim();
                if (message.accountStatus != null && Object.hasOwnProperty.call(message, "accountStatus"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int32(message.accountStatus);
                return writer;
            };

            /**
             * Encodes the specified CustomerProfile message, length delimited. Does not implicitly {@link com.example.CustomerProfile.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.example.CustomerProfile
             * @static
             * @param {com.example.ICustomerProfile} message CustomerProfile message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CustomerProfile.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CustomerProfile message from the specified reader or buffer.
             * @function decode
             * @memberof com.example.CustomerProfile
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.example.CustomerProfile} CustomerProfile
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CustomerProfile.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.example.CustomerProfile(), key, value;
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.userId = reader.string();
                            break;
                        }
                    case 2: {
                            message.fullName = reader.string();
                            break;
                        }
                    case 3: {
                            message.email = $root.com.example.EmailAddress.decode(reader, reader.uint32());
                            break;
                        }
                    case 4: {
                            message.age = reader.int32();
                            break;
                        }
                    case 5: {
                            message.address = $root.com.example.Address.decode(reader, reader.uint32());
                            break;
                        }
                    case 6: {
                            if (!(message.phoneNumbers && message.phoneNumbers.length))
                                message.phoneNumbers = [];
                            message.phoneNumbers.push($root.com.example.PhoneNumber.decode(reader, reader.uint32()));
                            break;
                        }
                    case 7: {
                            if (message.preferences === $util.emptyObject)
                                message.preferences = {};
                            let end2 = reader.uint32() + reader.pos;
                            key = "";
                            value = "";
                            while (reader.pos < end2) {
                                let tag2 = reader.uint32();
                                switch (tag2 >>> 3) {
                                case 1:
                                    key = reader.string();
                                    break;
                                case 2:
                                    value = reader.string();
                                    break;
                                default:
                                    reader.skipType(tag2 & 7);
                                    break;
                                }
                            }
                            message.preferences[key] = value;
                            break;
                        }
                    case 8: {
                            message.accountStatus = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CustomerProfile message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.example.CustomerProfile
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.example.CustomerProfile} CustomerProfile
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CustomerProfile.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CustomerProfile message.
             * @function verify
             * @memberof com.example.CustomerProfile
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CustomerProfile.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.userId != null && message.hasOwnProperty("userId"))
                    if (!$util.isString(message.userId))
                        return "userId: string expected";
                if (message.fullName != null && message.hasOwnProperty("fullName"))
                    if (!$util.isString(message.fullName))
                        return "fullName: string expected";
                if (message.email != null && message.hasOwnProperty("email")) {
                    let error = $root.com.example.EmailAddress.verify(message.email);
                    if (error)
                        return "email." + error;
                }
                if (message.age != null && message.hasOwnProperty("age"))
                    if (!$util.isInteger(message.age))
                        return "age: integer expected";
                if (message.address != null && message.hasOwnProperty("address")) {
                    let error = $root.com.example.Address.verify(message.address);
                    if (error)
                        return "address." + error;
                }
                if (message.phoneNumbers != null && message.hasOwnProperty("phoneNumbers")) {
                    if (!Array.isArray(message.phoneNumbers))
                        return "phoneNumbers: array expected";
                    for (let i = 0; i < message.phoneNumbers.length; ++i) {
                        let error = $root.com.example.PhoneNumber.verify(message.phoneNumbers[i]);
                        if (error)
                            return "phoneNumbers." + error;
                    }
                }
                if (message.preferences != null && message.hasOwnProperty("preferences")) {
                    if (!$util.isObject(message.preferences))
                        return "preferences: object expected";
                    let key = Object.keys(message.preferences);
                    for (let i = 0; i < key.length; ++i)
                        if (!$util.isString(message.preferences[key[i]]))
                            return "preferences: string{k:string} expected";
                }
                if (message.accountStatus != null && message.hasOwnProperty("accountStatus"))
                    switch (message.accountStatus) {
                    default:
                        return "accountStatus: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                return null;
            };

            /**
             * Creates a CustomerProfile message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.example.CustomerProfile
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.example.CustomerProfile} CustomerProfile
             */
            CustomerProfile.fromObject = function fromObject(object) {
                if (object instanceof $root.com.example.CustomerProfile)
                    return object;
                let message = new $root.com.example.CustomerProfile();
                if (object.userId != null)
                    message.userId = String(object.userId);
                if (object.fullName != null)
                    message.fullName = String(object.fullName);
                if (object.email != null) {
                    if (typeof object.email !== "object")
                        throw TypeError(".com.example.CustomerProfile.email: object expected");
                    message.email = $root.com.example.EmailAddress.fromObject(object.email);
                }
                if (object.age != null)
                    message.age = object.age | 0;
                if (object.address != null) {
                    if (typeof object.address !== "object")
                        throw TypeError(".com.example.CustomerProfile.address: object expected");
                    message.address = $root.com.example.Address.fromObject(object.address);
                }
                if (object.phoneNumbers) {
                    if (!Array.isArray(object.phoneNumbers))
                        throw TypeError(".com.example.CustomerProfile.phoneNumbers: array expected");
                    message.phoneNumbers = [];
                    for (let i = 0; i < object.phoneNumbers.length; ++i) {
                        if (typeof object.phoneNumbers[i] !== "object")
                            throw TypeError(".com.example.CustomerProfile.phoneNumbers: object expected");
                        message.phoneNumbers[i] = $root.com.example.PhoneNumber.fromObject(object.phoneNumbers[i]);
                    }
                }
                if (object.preferences) {
                    if (typeof object.preferences !== "object")
                        throw TypeError(".com.example.CustomerProfile.preferences: object expected");
                    message.preferences = {};
                    for (let keys = Object.keys(object.preferences), i = 0; i < keys.length; ++i)
                        message.preferences[keys[i]] = String(object.preferences[keys[i]]);
                }
                switch (object.accountStatus) {
                default:
                    if (typeof object.accountStatus === "number") {
                        message.accountStatus = object.accountStatus;
                        break;
                    }
                    break;
                case "ACTIVE":
                case 0:
                    message.accountStatus = 0;
                    break;
                case "INACTIVE":
                case 1:
                    message.accountStatus = 1;
                    break;
                case "SUSPENDED":
                case 2:
                    message.accountStatus = 2;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a CustomerProfile message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.example.CustomerProfile
             * @static
             * @param {com.example.CustomerProfile} message CustomerProfile
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CustomerProfile.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.phoneNumbers = [];
                if (options.objects || options.defaults)
                    object.preferences = {};
                if (options.defaults) {
                    object.userId = "";
                    object.fullName = "";
                    object.email = null;
                    object.age = 0;
                    object.address = null;
                    object.accountStatus = options.enums === String ? "ACTIVE" : 0;
                }
                if (message.userId != null && message.hasOwnProperty("userId"))
                    object.userId = message.userId;
                if (message.fullName != null && message.hasOwnProperty("fullName"))
                    object.fullName = message.fullName;
                if (message.email != null && message.hasOwnProperty("email"))
                    object.email = $root.com.example.EmailAddress.toObject(message.email, options);
                if (message.age != null && message.hasOwnProperty("age"))
                    object.age = message.age;
                if (message.address != null && message.hasOwnProperty("address"))
                    object.address = $root.com.example.Address.toObject(message.address, options);
                if (message.phoneNumbers && message.phoneNumbers.length) {
                    object.phoneNumbers = [];
                    for (let j = 0; j < message.phoneNumbers.length; ++j)
                        object.phoneNumbers[j] = $root.com.example.PhoneNumber.toObject(message.phoneNumbers[j], options);
                }
                let keys2;
                if (message.preferences && (keys2 = Object.keys(message.preferences)).length) {
                    object.preferences = {};
                    for (let j = 0; j < keys2.length; ++j)
                        object.preferences[keys2[j]] = message.preferences[keys2[j]];
                }
                if (message.accountStatus != null && message.hasOwnProperty("accountStatus"))
                    object.accountStatus = options.enums === String ? $root.com.example.AccountStatus[message.accountStatus] === undefined ? message.accountStatus : $root.com.example.AccountStatus[message.accountStatus] : message.accountStatus;
                return object;
            };

            /**
             * Converts this CustomerProfile to JSON.
             * @function toJSON
             * @memberof com.example.CustomerProfile
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CustomerProfile.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for CustomerProfile
             * @function getTypeUrl
             * @memberof com.example.CustomerProfile
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            CustomerProfile.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.example.CustomerProfile";
            };

            return CustomerProfile;
        })();

        return example;
    })();

    return com;
})();

export { $root as default };
