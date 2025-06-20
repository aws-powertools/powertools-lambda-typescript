import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace com. */
export namespace com {

    /** Namespace example. */
    namespace example {

        /** Namespace protobuf. */
        namespace protobuf {

            /** Properties of an Address. */
            interface IAddress {

                /** Address street */
                street?: (string|null);

                /** Address city */
                city?: (string|null);

                /** Address zip */
                zip?: (string|null);
            }

            /** Represents an Address. */
            class Address implements IAddress {

                /**
                 * Constructs a new Address.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: com.example.protobuf.IAddress);

                /** Address street. */
                public street: string;

                /** Address city. */
                public city: string;

                /** Address zip. */
                public zip: string;

                /**
                 * Creates a new Address instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Address instance
                 */
                public static create(properties?: com.example.protobuf.IAddress): com.example.protobuf.Address;

                /**
                 * Encodes the specified Address message. Does not implicitly {@link com.example.protobuf.Address.verify|verify} messages.
                 * @param message Address message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: com.example.protobuf.IAddress, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Address message, length delimited. Does not implicitly {@link com.example.protobuf.Address.verify|verify} messages.
                 * @param message Address message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: com.example.protobuf.IAddress, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Address message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Address
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.example.protobuf.Address;

                /**
                 * Decodes an Address message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Address
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.example.protobuf.Address;

                /**
                 * Verifies an Address message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an Address message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Address
                 */
                public static fromObject(object: { [k: string]: any }): com.example.protobuf.Address;

                /**
                 * Creates a plain object from an Address message. Also converts values to other types if specified.
                 * @param message Address
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: com.example.protobuf.Address, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Address to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Address
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a UserProfile. */
            interface IUserProfile {

                /** UserProfile userId */
                userId?: (string|null);

                /** UserProfile name */
                name?: (string|null);

                /** UserProfile email */
                email?: (string|null);

                /** UserProfile age */
                age?: (number|null);

                /** UserProfile isActive */
                isActive?: (boolean|null);

                /** UserProfile signupDate */
                signupDate?: (string|null);

                /** UserProfile tags */
                tags?: (string[]|null);

                /** UserProfile preferences */
                preferences?: ({ [k: string]: string }|null);

                /** UserProfile address */
                address?: (com.example.protobuf.IAddress|null);
            }

            /** Represents a UserProfile. */
            class UserProfile implements IUserProfile {

                /**
                 * Constructs a new UserProfile.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: com.example.protobuf.IUserProfile);

                /** UserProfile userId. */
                public userId: string;

                /** UserProfile name. */
                public name: string;

                /** UserProfile email. */
                public email: string;

                /** UserProfile age. */
                public age: number;

                /** UserProfile isActive. */
                public isActive: boolean;

                /** UserProfile signupDate. */
                public signupDate: string;

                /** UserProfile tags. */
                public tags: string[];

                /** UserProfile preferences. */
                public preferences: { [k: string]: string };

                /** UserProfile address. */
                public address?: (com.example.protobuf.IAddress|null);

                /**
                 * Creates a new UserProfile instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns UserProfile instance
                 */
                public static create(properties?: com.example.protobuf.IUserProfile): com.example.protobuf.UserProfile;

                /**
                 * Encodes the specified UserProfile message. Does not implicitly {@link com.example.protobuf.UserProfile.verify|verify} messages.
                 * @param message UserProfile message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: com.example.protobuf.IUserProfile, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified UserProfile message, length delimited. Does not implicitly {@link com.example.protobuf.UserProfile.verify|verify} messages.
                 * @param message UserProfile message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: com.example.protobuf.IUserProfile, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a UserProfile message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns UserProfile
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.example.protobuf.UserProfile;

                /**
                 * Decodes a UserProfile message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns UserProfile
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.example.protobuf.UserProfile;

                /**
                 * Verifies a UserProfile message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a UserProfile message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns UserProfile
                 */
                public static fromObject(object: { [k: string]: any }): com.example.protobuf.UserProfile;

                /**
                 * Creates a plain object from a UserProfile message. Also converts values to other types if specified.
                 * @param message UserProfile
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: com.example.protobuf.UserProfile, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this UserProfile to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for UserProfile
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }
    }
}
