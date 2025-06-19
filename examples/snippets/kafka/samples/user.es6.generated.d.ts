import * as $protobuf from "protobufjs";
import Long = require("long");
/** Properties of a User. */
export interface IUser {
	/** User id */
	id?: number | null;

	/** User name */
	name?: string | null;

	/** User price */
	price?: number | null;
}

/** Represents a User. */
export class User implements IUser {
	/**
	 * Constructs a new User.
	 * @param [properties] Properties to set
	 */
	constructor(properties?: IUser);

	/** User id. */
	public id: number;

	/** User name. */
	public name: string;

	/** User price. */
	public price: number;

	/**
	 * Creates a new User instance using the specified properties.
	 * @param [properties] Properties to set
	 * @returns User instance
	 */
	public static create(properties?: IUser): User;

	/**
	 * Encodes the specified User message. Does not implicitly {@link User.verify|verify} messages.
	 * @param message User message or plain object to encode
	 * @param [writer] Writer to encode to
	 * @returns Writer
	 */
	public static encode(
		message: IUser,
		writer?: $protobuf.Writer,
	): $protobuf.Writer;

	/**
	 * Encodes the specified User message, length delimited. Does not implicitly {@link User.verify|verify} messages.
	 * @param message User message or plain object to encode
	 * @param [writer] Writer to encode to
	 * @returns Writer
	 */
	public static encodeDelimited(
		message: IUser,
		writer?: $protobuf.Writer,
	): $protobuf.Writer;

	/**
	 * Decodes a User message from the specified reader or buffer.
	 * @param reader Reader or buffer to decode from
	 * @param [length] Message length if known beforehand
	 * @returns User
	 * @throws {Error} If the payload is not a reader or valid buffer
	 * @throws {$protobuf.util.ProtocolError} If required fields are missing
	 */
	public static decode(
		reader: $protobuf.Reader | Uint8Array,
		length?: number,
	): User;

	/**
	 * Decodes a User message from the specified reader or buffer, length delimited.
	 * @param reader Reader or buffer to decode from
	 * @returns User
	 * @throws {Error} If the payload is not a reader or valid buffer
	 * @throws {$protobuf.util.ProtocolError} If required fields are missing
	 */
	public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): User;

	/**
	 * Verifies a User message.
	 * @param message Plain object to verify
	 * @returns `null` if valid, otherwise the reason why it is not
	 */
	public static verify(message: { [k: string]: any }): string | null;

	/**
	 * Creates a User message from a plain object. Also converts values to their respective internal types.
	 * @param object Plain object
	 * @returns User
	 */
	public static fromObject(object: { [k: string]: any }): User;

	/**
	 * Creates a plain object from a User message. Also converts values to other types if specified.
	 * @param message User
	 * @param [options] Conversion options
	 * @returns Plain object
	 */
	public static toObject(
		message: User,
		options?: $protobuf.IConversionOptions,
	): { [k: string]: any };

	/**
	 * Converts this User to JSON.
	 * @returns JSON object
	 */
	public toJSON(): { [k: string]: any };

	/**
	 * Gets the default type url for User
	 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
	 * @returns The default type url
	 */
	public static getTypeUrl(typeUrlPrefix?: string): string;
}
