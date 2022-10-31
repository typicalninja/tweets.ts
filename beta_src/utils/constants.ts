export const versionData = {
	pkgVersion: '2.0.0-beta',
	defaultRequester: ''
}

export const userAgent = `tweets.ts/${versionData.pkgVersion} (https://github.com/typicalninja493/tweets.ts) Node.js/${process.version}  axios/${versionData.defaultRequester}`


export type ClientOptions = {
	request: RequestClientOptions | Request
}

export type RequestClientOptions = {
	type?: 'user' | 'app';
	userAgent?: string;
}

export const DefaultRequestClientOptions: RequestClientOptions = {
		type: 'app',

}