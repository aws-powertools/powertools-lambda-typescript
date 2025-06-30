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

        example.User = (function() {

            /**
             * Properties of a User.
             * @memberof com.example
             * @interface IUser
             * @property {string|null} [name] User name
             * @property {number|null} [age] User age
             */

            /**
             * Constructs a new User.
             * @memberof com.example
             * @classdesc Represents a User.
             * @implements IUser
             * @constructor
             * @param {com.example.IUser=} [properties] Properties to set
             */
            function User(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * User name.
             * @member {string} name
             * @memberof com.example.User
             * @instance
             */
            User.prototype.name = "";

            /**
             * User age.
             * @member {number} age
             * @memberof com.example.User
             * @instance
             */
            User.prototype.age = 0;

            /**
             * Creates a new User instance using the specified properties.
             * @function create
             * @memberof com.example.User
             * @static
             * @param {com.example.IUser=} [properties] Properties to set
             * @returns {com.example.User} User instance
             */
            User.create = function create(properties) {
                return new User(properties);
            };

            /**
             * Encodes the specified User message. Does not implicitly {@link com.example.User.verify|verify} messages.
             * @function encode
             * @memberof com.example.User
             * @static
             * @param {com.example.IUser} message User message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            User.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.age != null && Object.hasOwnProperty.call(message, "age"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.age);
                return writer;
            };

            /**
             * Encodes the specified User message, length delimited. Does not implicitly {@link com.example.User.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.example.User
             * @static
             * @param {com.example.IUser} message User message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            User.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a User message from the specified reader or buffer.
             * @function decode
             * @memberof com.example.User
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.example.User} User
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            User.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.example.User();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.name = reader.string();
                            break;
                        }
                    case 2: {
                            message.age = reader.int32();
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
             * Decodes a User message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.example.User
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.example.User} User
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            User.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a User message.
             * @function verify
             * @memberof com.example.User
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            User.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.age != null && message.hasOwnProperty("age"))
                    if (!$util.isInteger(message.age))
                        return "age: integer expected";
                return null;
            };

            /**
             * Creates a User message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.example.User
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.example.User} User
             */
            User.fromObject = function fromObject(object) {
                if (object instanceof $root.com.example.User)
                    return object;
                let message = new $root.com.example.User();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.age != null)
                    message.age = object.age | 0;
                return message;
            };

            /**
             * Creates a plain object from a User message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.example.User
             * @static
             * @param {com.example.User} message User
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            User.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.name = "";
                    object.age = 0;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.age != null && message.hasOwnProperty("age"))
                    object.age = message.age;
                return object;
            };

            /**
             * Converts this User to JSON.
             * @function toJSON
             * @memberof com.example.User
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            User.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for User
             * @function getTypeUrl
             * @memberof com.example.User
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            User.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.example.User";
            };

            return User;
        })();

        return example;
    })();

    return com;
})();

export { $root as default };
