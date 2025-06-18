/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.Product = (function() {

    /**
     * Properties of a Product.
     * @exports IProduct
     * @interface IProduct
     * @property {number|null} [id] Product id
     * @property {string|null} [name] Product name
     * @property {number|null} [price] Product price
     */

    /**
     * Constructs a new Product.
     * @exports Product
     * @classdesc Represents a Product.
     * @implements IProduct
     * @constructor
     * @param {IProduct=} [properties] Properties to set
     */
    function Product(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Product id.
     * @member {number} id
     * @memberof Product
     * @instance
     */
    Product.prototype.id = 0;

    /**
     * Product name.
     * @member {string} name
     * @memberof Product
     * @instance
     */
    Product.prototype.name = "";

    /**
     * Product price.
     * @member {number} price
     * @memberof Product
     * @instance
     */
    Product.prototype.price = 0;

    /**
     * Creates a new Product instance using the specified properties.
     * @function create
     * @memberof Product
     * @static
     * @param {IProduct=} [properties] Properties to set
     * @returns {Product} Product instance
     */
    Product.create = function create(properties) {
        return new Product(properties);
    };

    /**
     * Encodes the specified Product message. Does not implicitly {@link Product.verify|verify} messages.
     * @function encode
     * @memberof Product
     * @static
     * @param {IProduct} message Product message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Product.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
        if (message.price != null && Object.hasOwnProperty.call(message, "price"))
            writer.uint32(/* id 3, wireType 1 =*/25).double(message.price);
        return writer;
    };

    /**
     * Encodes the specified Product message, length delimited. Does not implicitly {@link Product.verify|verify} messages.
     * @function encodeDelimited
     * @memberof Product
     * @static
     * @param {IProduct} message Product message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Product.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Product message from the specified reader or buffer.
     * @function decode
     * @memberof Product
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Product} Product
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Product.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Product();
        while (reader.pos < end) {
            var tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int32();
                    break;
                }
            case 2: {
                    message.name = reader.string();
                    break;
                }
            case 3: {
                    message.price = reader.double();
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
     * Decodes a Product message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof Product
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {Product} Product
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Product.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Product message.
     * @function verify
     * @memberof Product
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Product.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.price != null && message.hasOwnProperty("price"))
            if (typeof message.price !== "number")
                return "price: number expected";
        return null;
    };

    /**
     * Creates a Product message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof Product
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {Product} Product
     */
    Product.fromObject = function fromObject(object) {
        if (object instanceof $root.Product)
            return object;
        var message = new $root.Product();
        if (object.id != null)
            message.id = object.id | 0;
        if (object.name != null)
            message.name = String(object.name);
        if (object.price != null)
            message.price = Number(object.price);
        return message;
    };

    /**
     * Creates a plain object from a Product message. Also converts values to other types if specified.
     * @function toObject
     * @memberof Product
     * @static
     * @param {Product} message Product
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Product.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.id = 0;
            object.name = "";
            object.price = 0;
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.price != null && message.hasOwnProperty("price"))
            object.price = options.json && !isFinite(message.price) ? String(message.price) : message.price;
        return object;
    };

    /**
     * Converts this Product to JSON.
     * @function toJSON
     * @memberof Product
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Product.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Product
     * @function getTypeUrl
     * @memberof Product
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Product.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/Product";
    };

    return Product;
})();

module.exports = $root;
