import { AxiosInstance } from 'axios';
import Client from '../client';
import { imageUploadEndpoints, RequestMethods } from '../util/constants';
import requestBucket from './bucket';
import getRequester from './request';
import { requestOptions } from '../client'
class rest {
	 _client: Client;
	private _rest: AxiosInstance;
	buckets: Map<string, requestBucket>;
	_baseUrl: string;
	constructor(client: Client) {
		this._client = client;
		const _r = getRequester(this._client.options.api)
		this._rest = _r.instance;
		this._baseUrl = _r.baseUrl;
		this.buckets = new Map();
	}
	async _request({ endPoint = '', method = RequestMethods.GET, bodyOrParams = {}, timeOut = 15000 }: requestOptions): Promise<any> {
		const requestHash = `${endPoint}:[${method}]`
		if(this.buckets.has(requestHash)) {
			this._debug(`Request Bucket found for hash ${requestHash}, queuing request to endpoint ${endPoint}, Total buckets: ${this.buckets.size}`)
			return await this.buckets.get(requestHash)?.request({ method, endPoint, bodyOrParams, timeOut })
		}
		else {
			// image upload uses a different url, upload.twitter.com
			const baseURL = imageUploadEndpoints.includes(endPoint) ? this._baseUrl.replace('api', 'upload') : this._baseUrl
			this._debug(`Request Bucket for Hash ${requestHash} Not found, creating a new Bucket, Total buckets: ${this.buckets.size + 1}`)
			this.buckets.set(requestHash, new requestBucket(endPoint, this._rest, baseURL, this, requestHash));
			return await this.buckets.get(requestHash)?.request({ method, endPoint, bodyOrParams, timeOut })
		}
	}
	_debug(msg: string) {
		if(this._client.debug && typeof this._client.debug == 'function') {
			return this._client.debug(`[REST => API] :: ${msg}`);
		}
	}
}


export default rest;