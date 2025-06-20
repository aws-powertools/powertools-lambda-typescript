import * as $protobuf from "protobufjs";
import Long = require("long");
/** Properties of a Product. */
export interface IProduct {

    /** Product id */
    id?: (number|null);

    /** Product name */
    name?: (string|null);

    /** Product price */
    price?: (number|null);
}

/** Represents a Product. */
export class Product implements IProduct {

    /**
     * Constructs a new Product.
     * @param [properties] Properties to set
     */
    constructor(properties?: IProduct);

    /** Product id. */
    public id: number;

    /** Product name. */
    public name: string;

    /** Product price. */
    public price: number;

    /**
     * Creates a new Product instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Product instance
     */
    public static create(properties?: IProduct): Product;

    /**
     * Encodes the specified Product message. Does not implicitly {@link Product.verify|verify} messages.
     * @param message Product message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IProduct, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Product message, length delimited. Does not implicitly {@link Product.verify|verify} messages.
     * @param message Product message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IProduct, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Product message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Product
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Product;

    /**
     * Decodes a Product message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Product
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): Product;

    /**
     * Verifies a Product message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a Product message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Product
     */
    public static fromObject(object: { [k: string]: any }): Product;

    /**
     * Creates a plain object from a Product message. Also converts values to other types if specified.
     * @param message Product
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: Product, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Product to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Product
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}
