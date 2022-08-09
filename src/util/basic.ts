export const percentEncode = (string: string) => {
    return string.replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
}


export const isUrl = (string: string) => {
	// if not a string return false
if (typeof string !== "string") {
	return false;
  }
  // accepted protocols
  const protocols = ['https', 'http'];
  try {
	const url = new URL(string);
	return protocols
		? url.protocol
			? protocols.map(u => `${u.toLowerCase()}:`).includes(url.protocol)
			: false
		: true;
	} catch {
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
