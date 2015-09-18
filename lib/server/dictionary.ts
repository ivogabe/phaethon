import { Map } from './map';
import { Type, expect, expectOptional, expectOrIgnore } from './validate';

export class Dictionary {
	private map: Map<any>;
	constructor(map: Map<any>) {
		this.map = map;
	}

	value<U>(key: string, type: Type<U>): U {
		return expect(this.map[key], type);
	}
	valueOptional<U>(key: string, type: Type<U>): U {
		return expectOptional(this.map[key], type);
	}
	valueOrIgnore<U>(key: string, type: Type<U>): U {
		return expectOrIgnore(this.map[key], type);
	}
}
