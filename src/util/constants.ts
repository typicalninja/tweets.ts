const pkg = require('../../../package.json')

// default UserAgent for api requests (can be overwritten in options)
export const userAgent = `tweets.ts/${pkg.version} (https://github.com/typicalninja493/tweets.ts) Node.js/${process.version}  Axios/${pkg.dependencies['axios'].replace('^', '')}`;

export const streamUrl = `https://stream.twitter.com/#{version}`

// default options for the client
export const defaultOptions = {
	authorization: {
		consumer_key:  '',
		consumer_secret:  '',
		access_token:  '',
		access_token_secret: '',
	},
	api: {
		version: '1.1',
		subdomain: 'api',
		rateLimits: true,
		userAgent: userAgent,
	},
	debug: null, 
};



export const RequestMethods = {
	GET: 'get',
	POST: 'post',
	PATCH: 'patch',
};

export const imageUploadEndpoints = [
	'/media/upload'
]