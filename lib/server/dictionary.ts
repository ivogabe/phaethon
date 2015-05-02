import Map = require('./map');
import validate = require('./validate');

class Dictionary {
	private map: Map<any>;
	constructor(map: Map<any>) {
		this.map = map;
	}

	value<U>(key: string, type: validate.Type<U>): U {
		return validate.expect(this.map[key], type);
	}
	valueOptional<U>(key: string, type: validate.Type<U>): U {
		return validate.expectOptional(this.map[key], type);
	}
	valueOrIgnore<U>(key: string, type: validate.Type<U>): U {
		return validate.expectOrIgnore(this.map[key], type);
	}
}

export = Dictionary;
