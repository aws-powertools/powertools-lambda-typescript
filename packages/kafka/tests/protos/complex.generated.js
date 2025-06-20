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

        example.protobuf = (function() {

            /**
             * Namespace protobuf.
             * @memberof com.example
             * @namespace
             */
            const protobuf = {};

            protobuf.Address = (function() {

                /**
                 * Properties of an Address.
                 * @memberof com.example.protobuf
                 * @interface IAddress
                 * @property {string|null} [street] Address street
                 * @property {string|null} [city] Address city
                 * @property {string|null} [zip] Address zip
                 */

                /**
                 * Constructs a new Address.
                 * @memberof com.example.protobuf
                 * @classdesc Represents an Address.
                 * @implements IAddress
                 * @constructor
                 * @param {com.example.protobuf.IAddress=} [properties] Properties to set
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
                 * @memberof com.example.protobuf.Address
                 * @instance
                 */
                Address.prototype.street = "";

                /**
                 * Address city.
                 * @member {string} city
                 * @memberof com.example.protobuf.Address
                 * @instance
                 */
                Address.prototype.city = "";

                /**
                 * Address zip.
                 * @member {string} zip
                 * @memberof com.example.protobuf.Address
                 * @instance
                 */
                Address.prototype.zip = "";

                /**
                 * Creates a new Address instance using the specified properties.
                 * @function create
                 * @memberof com.example.protobuf.Address
                 * @static
                 * @param {com.example.protobuf.IAddress=} [properties] Properties to set
                 * @returns {com.example.protobuf.Address} Address instance
                 */
                Address.create = function create(properties) {
                    return new Address(properties);
                };

                /**
                 * Encodes the specified Address message. Does not implicitly {@link com.example.protobuf.Address.verify|verify} messages.
                 * @function encode
                 * @memberof com.example.protobuf.Address
                 * @static
                 * @param {com.example.protobuf.IAddress} message Address message or plain object to encode
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
                    if (message.zip != null && Object.hasOwnProperty.call(message, "zip"))
                        writer.uint32(/* id 3, wireType 2 =*/26).string(message.zip);
                    return writer;
                };

                /**
                 * Encodes the specified Address message, length delimited. Does not implicitly {@link com.example.protobuf.Address.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof com.example.protobuf.Address
                 * @static
                 * @param {com.example.protobuf.IAddress} message Address message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Address.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes an Address message from the specified reader or buffer.
                 * @function decode
                 * @memberof com.example.protobuf.Address
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {com.example.protobuf.Address} Address
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Address.decode = function decode(reader, length, error) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.example.protobuf.Address();
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
                                message.zip = reader.string();
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
                 * @memberof com.example.protobuf.Address
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {com.example.protobuf.Address} Address
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
                 * @memberof com.example.protobuf.Address
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
                    if (message.zip != null && message.hasOwnProperty("zip"))
                        if (!$util.isString(message.zip))
                            return "zip: string expected";
                    return null;
                };

                /**
                 * Creates an Address message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof com.example.protobuf.Address
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {com.example.protobuf.Address} Address
                 */
                Address.fromObject = function fromObject(object) {
                    if (object instanceof $root.com.example.protobuf.Address)
                        return object;
                    let message = new $root.com.example.protobuf.Address();
                    if (object.street != null)
                        message.street = String(object.street);
                    if (object.city != null)
                        message.city = String(object.city);
                    if (object.zip != null)
                        message.zip = String(object.zip);
                    return message;
                };

                /**
                 * Creates a plain object from an Address message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof com.example.protobuf.Address
                 * @static
                 * @param {com.example.protobuf.Address} message Address
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
                        object.zip = "";
                    }
                    if (message.street != null && message.hasOwnProperty("street"))
                        object.street = message.street;
                    if (message.city != null && message.hasOwnProperty("city"))
                        object.city = message.city;
                    if (message.zip != null && message.hasOwnProperty("zip"))
                        object.zip = message.zip;
                    return object;
                };

                /**
                 * Converts this Address to JSON.
                 * @function toJSON
                 * @memberof com.example.protobuf.Address
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Address.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Address
                 * @function getTypeUrl
                 * @memberof com.example.protobuf.Address
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Address.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/com.example.protobuf.Address";
                };

                return Address;
            })();

            protobuf.UserProfile = (function() {

                /**
                 * Properties of a UserProfile.
                 * @memberof com.example.protobuf
                 * @interface IUserProfile
                 * @property {string|null} [userId] UserProfile userId
                 * @property {string|null} [name] UserProfile name
                 * @property {string|null} [email] UserProfile email
                 * @property {number|null} [age] UserProfile age
                 * @property {boolean|null} [isActive] UserProfile isActive
                 * @property {string|null} [signupDate] UserProfile signupDate
                 * @property {Array.<string>|null} [tags] UserProfile tags
                 * @property {Object.<string,string>|null} [preferences] UserProfile preferences
                 * @property {com.example.protobuf.IAddress|null} [address] UserProfile address
                 */

                /**
                 * Constructs a new UserProfile.
                 * @memberof com.example.protobuf
                 * @classdesc Represents a UserProfile.
                 * @implements IUserProfile
                 * @constructor
                 * @param {com.example.protobuf.IUserProfile=} [properties] Properties to set
                 */
                function UserProfile(properties) {
                    this.tags = [];
                    this.preferences = {};
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * UserProfile userId.
                 * @member {string} userId
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 */
                UserProfile.prototype.userId = "";

                /**
                 * UserProfile name.
                 * @member {string} name
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 */
                UserProfile.prototype.name = "";

                /**
                 * UserProfile email.
                 * @member {string} email
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 */
                UserProfile.prototype.email = "";

                /**
                 * UserProfile age.
                 * @member {number} age
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 */
                UserProfile.prototype.age = 0;

                /**
                 * UserProfile isActive.
                 * @member {boolean} isActive
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 */
                UserProfile.prototype.isActive = false;

                /**
                 * UserProfile signupDate.
                 * @member {string} signupDate
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 */
                UserProfile.prototype.signupDate = "";

                /**
                 * UserProfile tags.
                 * @member {Array.<string>} tags
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 */
                UserProfile.prototype.tags = $util.emptyArray;

                /**
                 * UserProfile preferences.
                 * @member {Object.<string,string>} preferences
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 */
                UserProfile.prototype.preferences = $util.emptyObject;

                /**
                 * UserProfile address.
                 * @member {com.example.protobuf.IAddress|null|undefined} address
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 */
                UserProfile.prototype.address = null;

                /**
                 * Creates a new UserProfile instance using the specified properties.
                 * @function create
                 * @memberof com.example.protobuf.UserProfile
                 * @static
                 * @param {com.example.protobuf.IUserProfile=} [properties] Properties to set
                 * @returns {com.example.protobuf.UserProfile} UserProfile instance
                 */
                UserProfile.create = function create(properties) {
                    return new UserProfile(properties);
                };

                /**
                 * Encodes the specified UserProfile message. Does not implicitly {@link com.example.protobuf.UserProfile.verify|verify} messages.
                 * @function encode
                 * @memberof com.example.protobuf.UserProfile
                 * @static
                 * @param {com.example.protobuf.IUserProfile} message UserProfile message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                UserProfile.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.userId);
                    if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                        writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
                    if (message.email != null && Object.hasOwnProperty.call(message, "email"))
                        writer.uint32(/* id 3, wireType 2 =*/26).string(message.email);
                    if (message.age != null && Object.hasOwnProperty.call(message, "age"))
                        writer.uint32(/* id 4, wireType 0 =*/32).int32(message.age);
                    if (message.isActive != null && Object.hasOwnProperty.call(message, "isActive"))
                        writer.uint32(/* id 5, wireType 0 =*/40).bool(message.isActive);
                    if (message.signupDate != null && Object.hasOwnProperty.call(message, "signupDate"))
                        writer.uint32(/* id 6, wireType 2 =*/50).string(message.signupDate);
                    if (message.tags != null && message.tags.length)
                        for (let i = 0; i < message.tags.length; ++i)
                            writer.uint32(/* id 7, wireType 2 =*/58).string(message.tags[i]);
                    if (message.preferences != null && Object.hasOwnProperty.call(message, "preferences"))
                        for (let keys = Object.keys(message.preferences), i = 0; i < keys.length; ++i)
                            writer.uint32(/* id 9, wireType 2 =*/74).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 2 =*/18).string(message.preferences[keys[i]]).ldelim();
                    if (message.address != null && Object.hasOwnProperty.call(message, "address"))
                        $root.com.example.protobuf.Address.encode(message.address, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified UserProfile message, length delimited. Does not implicitly {@link com.example.protobuf.UserProfile.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof com.example.protobuf.UserProfile
                 * @static
                 * @param {com.example.protobuf.IUserProfile} message UserProfile message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                UserProfile.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a UserProfile message from the specified reader or buffer.
                 * @function decode
                 * @memberof com.example.protobuf.UserProfile
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {com.example.protobuf.UserProfile} UserProfile
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                UserProfile.decode = function decode(reader, length, error) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.example.protobuf.UserProfile(), key, value;
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
                                message.name = reader.string();
                                break;
                            }
                        case 3: {
                                message.email = reader.string();
                                break;
                            }
                        case 4: {
                                message.age = reader.int32();
                                break;
                            }
                        case 5: {
                                message.isActive = reader.bool();
                                break;
                            }
                        case 6: {
                                message.signupDate = reader.string();
                                break;
                            }
                        case 7: {
                                if (!(message.tags && message.tags.length))
                                    message.tags = [];
                                message.tags.push(reader.string());
                                break;
                            }
                        case 9: {
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
                        case 10: {
                                message.address = $root.com.example.protobuf.Address.decode(reader, reader.uint32());
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
                 * Decodes a UserProfile message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof com.example.protobuf.UserProfile
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {com.example.protobuf.UserProfile} UserProfile
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                UserProfile.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a UserProfile message.
                 * @function verify
                 * @memberof com.example.protobuf.UserProfile
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                UserProfile.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.userId != null && message.hasOwnProperty("userId"))
                        if (!$util.isString(message.userId))
                            return "userId: string expected";
                    if (message.name != null && message.hasOwnProperty("name"))
                        if (!$util.isString(message.name))
                            return "name: string expected";
                    if (message.email != null && message.hasOwnProperty("email"))
                        if (!$util.isString(message.email))
                            return "email: string expected";
                    if (message.age != null && message.hasOwnProperty("age"))
                        if (!$util.isInteger(message.age))
                            return "age: integer expected";
                    if (message.isActive != null && message.hasOwnProperty("isActive"))
                        if (typeof message.isActive !== "boolean")
                            return "isActive: boolean expected";
                    if (message.signupDate != null && message.hasOwnProperty("signupDate"))
                        if (!$util.isString(message.signupDate))
                            return "signupDate: string expected";
                    if (message.tags != null && message.hasOwnProperty("tags")) {
                        if (!Array.isArray(message.tags))
                            return "tags: array expected";
                        for (let i = 0; i < message.tags.length; ++i)
                            if (!$util.isString(message.tags[i]))
                                return "tags: string[] expected";
                    }
                    if (message.preferences != null && message.hasOwnProperty("preferences")) {
                        if (!$util.isObject(message.preferences))
                            return "preferences: object expected";
                        let key = Object.keys(message.preferences);
                        for (let i = 0; i < key.length; ++i)
                            if (!$util.isString(message.preferences[key[i]]))
                                return "preferences: string{k:string} expected";
                    }
                    if (message.address != null && message.hasOwnProperty("address")) {
                        let error = $root.com.example.protobuf.Address.verify(message.address);
                        if (error)
                            return "address." + error;
                    }
                    return null;
                };

                /**
                 * Creates a UserProfile message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof com.example.protobuf.UserProfile
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {com.example.protobuf.UserProfile} UserProfile
                 */
                UserProfile.fromObject = function fromObject(object) {
                    if (object instanceof $root.com.example.protobuf.UserProfile)
                        return object;
                    let message = new $root.com.example.protobuf.UserProfile();
                    if (object.userId != null)
                        message.userId = String(object.userId);
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.email != null)
                        message.email = String(object.email);
                    if (object.age != null)
                        message.age = object.age | 0;
                    if (object.isActive != null)
                        message.isActive = Boolean(object.isActive);
                    if (object.signupDate != null)
                        message.signupDate = String(object.signupDate);
                    if (object.tags) {
                        if (!Array.isArray(object.tags))
                            throw TypeError(".com.example.protobuf.UserProfile.tags: array expected");
                        message.tags = [];
                        for (let i = 0; i < object.tags.length; ++i)
                            message.tags[i] = String(object.tags[i]);
                    }
                    if (object.preferences) {
                        if (typeof object.preferences !== "object")
                            throw TypeError(".com.example.protobuf.UserProfile.preferences: object expected");
                        message.preferences = {};
                        for (let keys = Object.keys(object.preferences), i = 0; i < keys.length; ++i)
                            message.preferences[keys[i]] = String(object.preferences[keys[i]]);
                    }
                    if (object.address != null) {
                        if (typeof object.address !== "object")
                            throw TypeError(".com.example.protobuf.UserProfile.address: object expected");
                        message.address = $root.com.example.protobuf.Address.fromObject(object.address);
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a UserProfile message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof com.example.protobuf.UserProfile
                 * @static
                 * @param {com.example.protobuf.UserProfile} message UserProfile
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                UserProfile.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.arrays || options.defaults)
                        object.tags = [];
                    if (options.objects || options.defaults)
                        object.preferences = {};
                    if (options.defaults) {
                        object.userId = "";
                        object.name = "";
                        object.email = "";
                        object.age = 0;
                        object.isActive = false;
                        object.signupDate = "";
                        object.address = null;
                    }
                    if (message.userId != null && message.hasOwnProperty("userId"))
                        object.userId = message.userId;
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.email != null && message.hasOwnProperty("email"))
                        object.email = message.email;
                    if (message.age != null && message.hasOwnProperty("age"))
                        object.age = message.age;
                    if (message.isActive != null && message.hasOwnProperty("isActive"))
                        object.isActive = message.isActive;
                    if (message.signupDate != null && message.hasOwnProperty("signupDate"))
                        object.signupDate = message.signupDate;
                    if (message.tags && message.tags.length) {
                        object.tags = [];
                        for (let j = 0; j < message.tags.length; ++j)
                            object.tags[j] = message.tags[j];
                    }
                    let keys2;
                    if (message.preferences && (keys2 = Object.keys(message.preferences)).length) {
                        object.preferences = {};
                        for (let j = 0; j < keys2.length; ++j)
                            object.preferences[keys2[j]] = message.preferences[keys2[j]];
                    }
                    if (message.address != null && message.hasOwnProperty("address"))
                        object.address = $root.com.example.protobuf.Address.toObject(message.address, options);
                    return object;
                };

                /**
                 * Converts this UserProfile to JSON.
                 * @function toJSON
                 * @memberof com.example.protobuf.UserProfile
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                UserProfile.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for UserProfile
                 * @function getTypeUrl
                 * @memberof com.example.protobuf.UserProfile
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                UserProfile.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/com.example.protobuf.UserProfile";
                };

                return UserProfile;
            })();

            return protobuf;
        })();

        return example;
    })();

    return com;
})();

export { $root as default };
