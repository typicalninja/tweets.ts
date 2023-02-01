export const versionData = {
	pkgVersion: '2.0.0-beta',
	defaultRequester: '0.0.0'
}

export const userAgent = `tweets.ts/${versionData.pkgVersion} (https://github.com/typicalninja493/tweets.ts) Node.js/${process.version}  axios/${versionData.defaultRequester}`
export const baseApiUrl = ``

export type ClientOptions = {
	request: RequestClientOptions | Request
}

export type RequestClientOptions = {
	type?: 'user' | 'app';
	userAgent?: string;
	authorization: {
		consumer_key?: string;
		consumer_secret?: string;
		access_token?: string;
		access_token_secret?: string;
	};
	version?: string;
}

export const DefaultRequestClientOptions: RequestClientOptions = {
	type: 'app',
	userAgent,
	authorization: {},
	version: '1.1'
}