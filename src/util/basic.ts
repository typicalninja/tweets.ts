/*export const mergeBody = (body: {}, body_1: any) => {
	if(typeof body_1 == 'object') {
		const objectKeys = Object.keys(body_1);
		const newBody = {...body};
		for(const key of objectKeys) {
			Object.defineProperty(newBody, key, { value: body_1[key], writable: true, enumerable: true, configurable: true });
		}
		return newBody;
	}
	return body;
};*/


export const percentEncode = (string: string) => {
    return string.replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
}


export const isUrl = (string: string) => {
if (typeof string !== "string") {
	return false;
  }

  const protocols = ['https', 'http'];
  let url;
  try {
	url = new URL(string);
	return protocols
		? url.protocol
			? protocols.map(u => `${u.toLowerCase()}:`).includes(url.protocol)
			: false
		: true;
} catch (err) {
	return false;
}
};


export const chunkBuffer = (buffer: Buffer | string, maxBytes = 1 * 1024 * 1024): { buffers: Buffer[], buffer: Buffer } => {
	// need to make sure its a valid buffer
	buffer = Buffer.from(buffer)
	const buffers: Buffer[] = [];
    let i = 0;

	while(i < buffer.length) {
		buffers.push(buffer.slice(i, i += maxBytes))
	}
	return { buffers, buffer };
};
