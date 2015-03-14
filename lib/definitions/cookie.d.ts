declare module "cookie" {
	export interface CookieSerializeOptions {
		encode?: (val: string) => string;
		path?: string;
		expires?: Date;
		maxAge?: number;
		domain?: string;
		secure?: boolean;
		httpOnly?: boolean;
	}

	export interface CookieParseOptions {
		decode?: (val: string) => string;
	}

    export function serialize(name: string, val: string, options?: CookieSerializeOptions): string;

    export function parse(str: string, options?: CookieParseOptions): { [key: string]: string };
}
