import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace com. */
export namespace com {

    /** Namespace example. */
    namespace example {

        /** PhoneType enum. */
        enum PhoneType {
            HOME = 0,
            WORK = 1,
            MOBILE = 2
        }

        /** AccountStatus enum. */
        enum AccountStatus {
            ACTIVE = 0,
            INACTIVE = 1,
            SUSPENDED = 2
        }

        /** Properties of an EmailAddress. */
        interface IEmailAddress {

            /** EmailAddress address */
            address?: (string|null);

            /** EmailAddress verified */
            verified?: (boolean|null);

            /** EmailAddress primary */
            primary?: (boolean|null);
        }

        /** Represents an EmailAddress. */
        class EmailAddress implements IEmailAddress {

            /**
             * Constructs a new EmailAddress.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.example.IEmailAddress);

            /** EmailAddress address. */
            public address: string;

            /** EmailAddress verified. */
            public verified: boolean;

            /** EmailAddress primary. */
            public primary: boolean;

            /**
             * Creates a new EmailAddress instance using the specified properties.
             * @param [properties] Properties to set
             * @returns EmailAddress instance
             */
            public static create(properties?: com.example.IEmailAddress): com.example.EmailAddress;

            /**
             * Encodes the specified EmailAddress message. Does not implicitly {@link com.example.EmailAddress.verify|verify} messages.
             * @param message EmailAddress message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.example.IEmailAddress, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EmailAddress message, length delimited. Does not implicitly {@link com.example.EmailAddress.verify|verify} messages.
             * @param message EmailAddress message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.example.IEmailAddress, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EmailAddress message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EmailAddress
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.example.EmailAddress;

            /**
             * Decodes an EmailAddress message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EmailAddress
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.example.EmailAddress;

            /**
             * Verifies an EmailAddress message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EmailAddress message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EmailAddress
             */
            public static fromObject(object: { [k: string]: any }): com.example.EmailAddress;

            /**
             * Creates a plain object from an EmailAddress message. Also converts values to other types if specified.
             * @param message EmailAddress
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.example.EmailAddress, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EmailAddress to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for EmailAddress
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an Address. */
        interface IAddress {

            /** Address street */
            street?: (string|null);

            /** Address city */
            city?: (string|null);

            /** Address state */
            state?: (string|null);

            /** Address country */
            country?: (string|null);

            /** Address zipCode */
            zipCode?: (string|null);
        }

        /** Represents an Address. */
        class Address implements IAddress {

            /**
             * Constructs a new Address.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.example.IAddress);

            /** Address street. */
            public street: string;

            /** Address city. */
            public city: string;

            /** Address state. */
            public state: string;

            /** Address country. */
            public country: string;

            /** Address zipCode. */
            public zipCode: string;

            /**
             * Creates a new Address instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Address instance
             */
            public static create(properties?: com.example.IAddress): com.example.Address;

            /**
             * Encodes the specified Address message. Does not implicitly {@link com.example.Address.verify|verify} messages.
             * @param message Address message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.example.IAddress, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Address message, length delimited. Does not implicitly {@link com.example.Address.verify|verify} messages.
             * @param message Address message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.example.IAddress, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Address message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Address
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.example.Address;

            /**
             * Decodes an Address message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Address
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.example.Address;

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
            public static fromObject(object: { [k: string]: any }): com.example.Address;

            /**
             * Creates a plain object from an Address message. Also converts values to other types if specified.
             * @param message Address
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.example.Address, options?: $protobuf.IConversionOptions): { [k: string]: any };

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

        /** Properties of a PhoneNumber. */
        interface IPhoneNumber {

            /** PhoneNumber number */
            number?: (string|null);

            /** PhoneNumber type */
            type?: (com.example.PhoneType|null);
        }

        /** Represents a PhoneNumber. */
        class PhoneNumber implements IPhoneNumber {

            /**
             * Constructs a new PhoneNumber.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.example.IPhoneNumber);

            /** PhoneNumber number. */
            public number: string;

            /** PhoneNumber type. */
            public type: com.example.PhoneType;

            /**
             * Creates a new PhoneNumber instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PhoneNumber instance
             */
            public static create(properties?: com.example.IPhoneNumber): com.example.PhoneNumber;

            /**
             * Encodes the specified PhoneNumber message. Does not implicitly {@link com.example.PhoneNumber.verify|verify} messages.
             * @param message PhoneNumber message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.example.IPhoneNumber, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PhoneNumber message, length delimited. Does not implicitly {@link com.example.PhoneNumber.verify|verify} messages.
             * @param message PhoneNumber message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.example.IPhoneNumber, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PhoneNumber message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PhoneNumber
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.example.PhoneNumber;

            /**
             * Decodes a PhoneNumber message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PhoneNumber
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.example.PhoneNumber;

            /**
             * Verifies a PhoneNumber message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PhoneNumber message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PhoneNumber
             */
            public static fromObject(object: { [k: string]: any }): com.example.PhoneNumber;

            /**
             * Creates a plain object from a PhoneNumber message. Also converts values to other types if specified.
             * @param message PhoneNumber
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.example.PhoneNumber, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PhoneNumber to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PhoneNumber
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CustomerProfile. */
        interface ICustomerProfile {

            /** CustomerProfile userId */
            userId?: (string|null);

            /** CustomerProfile fullName */
            fullName?: (string|null);

            /** CustomerProfile email */
            email?: (com.example.IEmailAddress|null);

            /** CustomerProfile age */
            age?: (number|null);

            /** CustomerProfile address */
            address?: (com.example.IAddress|null);

            /** CustomerProfile phoneNumbers */
            phoneNumbers?: (com.example.IPhoneNumber[]|null);

            /** CustomerProfile preferences */
            preferences?: ({ [k: string]: string }|null);

            /** CustomerProfile accountStatus */
            accountStatus?: (com.example.AccountStatus|null);
        }

        /** Represents a CustomerProfile. */
        class CustomerProfile implements ICustomerProfile {

            /**
             * Constructs a new CustomerProfile.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.example.ICustomerProfile);

            /** CustomerProfile userId. */
            public userId: string;

            /** CustomerProfile fullName. */
            public fullName: string;

            /** CustomerProfile email. */
            public email?: (com.example.IEmailAddress|null);

            /** CustomerProfile age. */
            public age: number;

            /** CustomerProfile address. */
            public address?: (com.example.IAddress|null);

            /** CustomerProfile phoneNumbers. */
            public phoneNumbers: com.example.IPhoneNumber[];

            /** CustomerProfile preferences. */
            public preferences: { [k: string]: string };

            /** CustomerProfile accountStatus. */
            public accountStatus: com.example.AccountStatus;

            /**
             * Creates a new CustomerProfile instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CustomerProfile instance
             */
            public static create(properties?: com.example.ICustomerProfile): com.example.CustomerProfile;

            /**
             * Encodes the specified CustomerProfile message. Does not implicitly {@link com.example.CustomerProfile.verify|verify} messages.
             * @param message CustomerProfile message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.example.ICustomerProfile, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CustomerProfile message, length delimited. Does not implicitly {@link com.example.CustomerProfile.verify|verify} messages.
             * @param message CustomerProfile message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.example.ICustomerProfile, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CustomerProfile message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CustomerProfile
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.example.CustomerProfile;

            /**
             * Decodes a CustomerProfile message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CustomerProfile
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.example.CustomerProfile;

            /**
             * Verifies a CustomerProfile message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CustomerProfile message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CustomerProfile
             */
            public static fromObject(object: { [k: string]: any }): com.example.CustomerProfile;

            /**
             * Creates a plain object from a CustomerProfile message. Also converts values to other types if specified.
             * @param message CustomerProfile
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.example.CustomerProfile, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CustomerProfile to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for CustomerProfile
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
