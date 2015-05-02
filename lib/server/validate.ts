import ServerError = require('./servererror');
import StatusCode = require('./statuscode');
import Map = require('map');

export interface Type<T> {
	(value: any): boolean;
	__typeBrand?: T;
}
function isTypeOf<U>(typeOfString: string): Type<U> {
	return (value) => typeof value === typeOfString;
}
export function isInstanceOf<U>(instanceOfClass: { new(...args: any[]): U }): Type<U> {
	return (value) => (value instanceof <Function> instanceOfClass);
}

export let isAny = <Type<any>>((value) => (value !== undefined && value !== null));
export let isString = isTypeOf<string>('string');
export let isNumber = isTypeOf<number>('number');
export let isRealNumber = <Type<number>> ((value) => isNumber(value) && value !== NaN && value !== Infinity && value !== -Infinity);
export let isBoolean = isTypeOf<boolean>('boolean');
export let isObject = isTypeOf<Object>('object');

export let isDate = isInstanceOf(Date);
export let isBuffer = <Type<Buffer>> Buffer.isBuffer;

export function isArrayOf<U>(contentType: Type<U>, optional = false): Type<U[]> {
	return (value) => {
		if (!(value instanceof Array)) return false;
		for (let i = 0; i < (<Array<any>> value).length; i++) {
			let item = (<Array<any>> value)[i];
			if (optional && item === undefined) continue;
			if (!contentType(item)) return false;
		}
		return true;
	};
}
export function isMapOf<U>(contentType: Type<U>, optional = false): Type<Map<U>> {
	return (value) => {
		if (typeof value !== 'object') return false;
		for (let key in value) {
			if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
			if (typeof key === 'number') return false;
			let item = (<Map<any>> value)[key];
			if (optional && (item === undefined || item === null)) continue;
			if (!contentType(item)) return false;
		}
		return true;
	};
}

/**
 * Checks that value matches the provided type.
 * Returns the value if it passed, otherwise it throws an error.
 */
export function expect<U>(value: any, type: Type<U>): U {
	if (!type(value)) throw new ServerError(StatusCode.ClientErrorBadRequest);
	return value;
}
/**
 * Checks that value matches the provided type or is undefined.
 * Returns the value if it passed, otherwise it throws an error.
 */
export function expectOptional<U>(value: any, type: Type<U>): U {
	if (value === undefined || value === null) return value;
	return expect(value, type);
}
/**
 * Checks that value matches the provided type.
 * Returns the value if it passed, otherwise it returns undefined.
 */
export function expectOrIgnore<U>(value: any, type: Type<U>): U {
	try {
		return expect(value, type);
	} catch (e) {
		return undefined;
	}
}
