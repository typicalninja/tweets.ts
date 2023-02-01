export default class Client {
    /**
	 * Get the Bearer Token for current Client
	 */
	getBearerToken(): Promise<string> {
		return new Promise((resolve, reject) => {
			if(this.bearerToken) return this.bearerToken;
			if(this.options.type !== 'app') throw new Error(`[getBearerToken]: Is only Supported With App Authentication`)
			// as Per https://developer.twitter.com/en/docs/authentication/oauth-2-0/application-only
			axios.post('https://api.twitter.com/oauth2/token',  'grant_type=client_credentials',
				{	
					responseType: 'json',
					headers: {
					'Authorization': `Basic ${Buffer.from(`${this.options.authorization.consumer_key}:${this.options.authorization.consumer_secret}`).toString('base64')}`,
					'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
					},
				}
			).then(({ data }) => {
				if(!data || data.token_type !== 'bearer') return reject(`Invalid Token Type in returned Data [${data.token_type}] - Expected bearer`);
				this.bearerToken = data.access_token as string
				return resolve(this.bearerToken);
			}).catch(reject);
		});
	}
}