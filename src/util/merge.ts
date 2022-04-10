import _merge from 'lodash.merge';

export const isObject = (object: {} | any) => {
	return !!object && typeof object === 'object';
}

/*export const merge = (target: any, source: any) => {
	if (!isObject(target) || !isObject(source)) {
	  return null;
	}
  
	Object.keys(source).forEach(key => {
	  const targetValue = target[key];
	  const sourceValue = source[key];
  
	  if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
		target[key] = targetValue.concat(sourceValue);
	  } else if (isObject(targetValue) && isObject(sourceValue)) {
		target[key] = merge(Object.assign({}, targetValue), sourceValue);
	  } else {
		target[key] = sourceValue;
	  }
	});
  
	return target;
  }*/

// export merge instead from lodash.merge
export { _merge as merge };