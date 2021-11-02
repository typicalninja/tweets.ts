import util from 'node:util'

/**
 * Validates a unknown value is a object and checks types of the keys if keys is specified and the relevant key exists on the object
 * @param {object} object - object to validate
 * @param {object} keys - keys to validate in the object, key:typeof pair should be in the object
 * @returns 
 */
export const objectValidation = (object: any, keys: any) => {
	if(typeof object !== 'object') throw new Error(`Expected a Object but received ${typeof object}`);
	if(typeof keys !== 'object') throw new Error(`Expected Keys to be a object received ${typeof keys}`)
	const ObjectKeys = Object.keys(keys)
	for (const key of ObjectKeys) {
		// for objects inside objects
		if(typeof keys[key] == 'object') {
			if(typeof object[key] == 'object') {
				objectValidation(object[key], keys[key]);
			}
		}
		else {
			if(object[key]) {
				if(typeof object[key] !== keys[key]) throw new Error(`Expected Key ${key} of value ${util.inspect(object[key])} to be of Type of ${util.inspect(typeof keys[key] == 'string' ? keys[key] : typeof keys[key])} received ${typeof object[key]}`)
			}
		}
	}
	return true;
}
/*
	if(object[key]) {
	if(typeof object[key] !== keys[key] && typeof object[key] !== typeof keys[key]) throw new Error(`Expected Key ${key} Of value ${util.inspect(object[key])} to be of Type of ${util.inspect(typeof keys[key] == 'string' ? keys[key] : typeof keys[key])} received ${typeof object[key]}`)
	if(typeof keys[key] == 'object') {
		objectValidation(object[key], keys[key])
	}
*/
