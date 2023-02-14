enum SameSite {
  DEFAULT_MODE = '',
  LAX_MODE = 'Lax',
  STRICT_MODE = 'Strict',
  NONE_MODE = 'None',
}

class Cookie {
  public constructor(
    private name: string,
    private value: string,
    private path: string = '',
    private domain: string = '',
    private secure: boolean = true,
    private httpOnly: boolean = false,
    private maxAge?: number,
    private expires?: Date,
    private sameSite?: SameSite,
    private customAttributes?: string[]
  ) {
    this.name = name;
    this.value = value;
    this.path = path;
    this.domain = domain;
    this.secure = secure;
    this.httpOnly = httpOnly;
    this.maxAge = maxAge;
    this.expires = expires;
    this.sameSite = sameSite;
    this.customAttributes = customAttributes;
  }

  public toString = (): string => {
    const cookieParts: string[] = [];
    cookieParts.push(`${this.name}=${this.value}`);

    if (this.path) {
      cookieParts.push(`Path=${this.path}`);
    }
    if (this.domain) {
      cookieParts.push(`Domain=${this.domain}`);
    }

    if (this.expires) {
      cookieParts.push(`Expires=${this.expires.toUTCString()}`);
    }

    if (this.maxAge) {
      cookieParts.push(`MaxAge=${this.maxAge}`);
    } else {
      cookieParts.push(`MaxAge=0`);
    }
    if (this.httpOnly) {
      cookieParts.push(`HttpOnly`);
    }

    if (this.secure) {
      cookieParts.push(`Secure`);
    }

    if (this.sameSite) {
      cookieParts.push(`SameSite=${this.sameSite}`);
    }

    if (this.customAttributes) {
      cookieParts.push(this.customAttributes.join('; '));
    }

    return cookieParts.join('; ');
  };
}

export { SameSite, Cookie };
