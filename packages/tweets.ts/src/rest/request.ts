import { DefaultRequestClientOptions, RequestClientOptions } from "../utils/constants";
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';
// web request module of choice is axios
import axios from 'axios';

/**
 * The Default Module Used By the Client ot make Requests, handles base
 */
export default class RestClient {
	bearerToken: null | string
	options: RequestClientOptions;
	apiUrl: string;
	constructor(options: RequestClientOptions) {
		this.bearerToken = null;
		this.options = Object.assign({}, DefaultRequestClientOptions, options);
		// validate the options
		this.validateOptions()
		this.apiUrl = `https://api.twitter.com/${this.options.version}`;
	}
	private validateOptions() {
		if(!['user', 'app'].includes(this.options.type as string)) throw new Error(`Invalid Client Type: ${this.options.type}`)
		
		const requiredAuthValues = ['consumer_key', 'consumer_secret']

		if(this.options.type == 'user') requiredAuthValues.push('access_token', 'access_token_secret')
		requiredAuthValues.forEach((opt) => {
			// @ts-ignore
			if(!this.options.authorization[opt]) throw new Error(`Expected Option "${opt}" for ${this.options.type} Authentication`)
		});
	}
	get(path: string) {
			
	}
}