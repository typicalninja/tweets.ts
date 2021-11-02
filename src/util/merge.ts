import { defaultOptions } from "./constants";

export const isObject = (object: {} | any) => {
	return !!object && typeof object === 'object';
}

const merge = (objectToMerge: {}, DefaultOptions = defaultOptions) => {
	const final = {}
	if(!isObject(objectToMerge)) throw new Error('ObjectToMerge must be a Object')
	const configKeys = Object.keys(defaultOptions);
	for(const key of configKeys) {
		// @ts-ignore
		if(isObject(defaultOptions[key])) {
					// @ts-ignore
			Object.defineProperty(final, key, { value: merge(objectToMerge[key] || {}, defaultOptions[key]), enumerable: true })
		}
		else {
			// @ts-ignore
			Object.defineProperty(final, key, { value: defaultOptions[key], enumerable: true })
		}
	}
	const objKeys = Object.keys(objectToMerge);
	for(const key of objKeys) {
		// @ts-ignore
		if(isObject(objectToMerge[key])) {
					// @ts-ignore
			Object.defineProperty(final, key, { value: merge(objectToMerge[key] || {}, defaultOptions[key]), enumerable: true })
		}
		else {
				// @ts-ignore
			Object.defineProperty(final, key, { value: objectToMerge[key], enumerable: true })
		}
	}
	return final;
};