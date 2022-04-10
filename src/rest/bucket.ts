import { AsyncQueue } from "@sapphire/async-queue";
import axios, { AxiosInstance, AxiosResponseHeaders, Method } from "axios";
import { imageUploadEndpoints, RequestMethods, userAgent } from "../util/constants";
import isObjectEmpty from 'lodash.isempty'
import rest from "./rest";
import util from 'util';
import { percentEncode } from "../util/basic";



const sleep = util.promisify(setTimeout);


interface requestResolved {
	endpoint: string,
	params: {} | null,
	body: {},
	url: string,
	method: string
}

class requestBucket {
	queue: AsyncQueue;
	endPoint: string;
	rateLimit: { limited: boolean; reset: number; remaining: number; limit: number; };
	private _requester: AxiosInstance;
	baseURL: string;
	restManager: rest;
	hash: string;
	frozen: boolean;
	constructor(endPoint: string, requester: AxiosInstance, baseURL: string, restManager: rest, hash: string) {
		this.queue = new AsyncQueue();
		this.endPoint = endPoint;
		this.baseURL = baseURL;
		this.restManager = restManager
		this.hash = hash
		// should be edited to real values after a request gets made
		this.rateLimit = {
			limited: false,
			reset: 1,
			remaining: 1,
			limit: 1,
		};
		this.frozen = false;
		this._requester = requester;
	}
	_debug(msg: string) {
		if(this.restManager._client.debug && typeof this.restManager._client.debug == 'function') {
			return this.restManager._client.debug(`[Bucket ${this.hash} => REST] :: ${msg}`);
		}
	}
	request({ method = RequestMethods.GET, endPoint = this.endPoint, bodyOrParams = {}, timeOut = 15000 }): Promise<any> {
		const CancelToken = axios.CancelToken;
		const source = CancelToken.source();
		let stopped = false;
		// @ts-ignore
		if(!this._requester[method] || typeof this._requester[method] !== 'function') throw new Error(`${method} is a Invalid RequestMethod`)
		return new Promise((resolve, reject) => {
			// timer for requests that is still in the queue
			const Timer = setTimeout(() => {
				source.cancel('TimeOut Exceeded');
				stopped = true;
				reject(new Error(`TimeOut of ${timeOut} Exceeded`))
			}, timeOut).unref()

			// wait for the queue to pass, .then will pass when previous is done
			this.queue.wait().then(() => {
				// Timer rejected due to timeout
				if(stopped) return;
				if(this.frozen) resolve(this.request({ method, endPoint, bodyOrParams, timeOut }));

				const requestResolved = this._resolveRequest({ method, endPoint, bodyOrParams, });
				const headers = this._resolveHeaders(requestResolved);

				// send a debug log for... debugging
				this._debug(`
				[New Request]:

				Url: ${requestResolved.url}
				Endpoint: ${requestResolved.endpoint}
				Method: ${method}
				Headers: ${util.inspect(headers)}
				body: ${util.inspect(requestResolved.body)}
				`)

				// request config for Axios request
				const requestConfig = {
					url: requestResolved.url, 
					cancelToken: source.token,
					headers: {
						'user-agent': userAgent,
						'Content-Type': 'application/json',
						Accept: 'application/json',
						...headers,
					},
				}
				if(method == RequestMethods.POST) {
					Object.defineProperty(requestConfig, 'method', { value: method, configurable: true, enumerable: true })
					Object.defineProperty(requestConfig, 'data', { value: percentEncode(new URLSearchParams(requestResolved.body).toString()), configurable: true, enumerable: true })
					requestConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded'
					if(imageUploadEndpoints.includes(endPoint)) {
						//requestConfig.headers['Content-Type'] = 'multipart/form-data'
					}
				}
				this._requester(requestConfig).then((response) => {
					// we were too late : (
					if(stopped) return this._debug(`[Method: ${method}, EndPoint: ${endPoint}] :: Request Was Successfully made, but the Timeout Exceeded`)
					// clear the Timeout, as the request succeed and only need to be resolved, and queue continued
					clearTimeout(Timer);
					// updated the Rate-limit info
					this.updateRateLimitInfo(response.headers)
					this._debug(`[Method: ${method}, EndPoint: ${endPoint}] :: Fetch was successful, releasing the queue, and processing next item in 2 seconds`)
					// resolve the promise with the result
					resolve(this._parseResponse(response));
					// wait 2 seconds
					sleep(2000).then(() => {
						this.queue.shift();
					});
				}).catch((err) => {
					if(stopped) return this._debug(`[Method: ${method}, EndPoint: ${endPoint}] :: Request Errored cannot reject due to Timeout Exceeding\nErr: ${err}`)
					if(err.response) {
						this._debug(`[Method: ${method}, EndPoint: ${endPoint}] :: The Request was Made, but A Error Occurred, with status code: ${err.response.status}`)
						// its a rateLimit, wait until is passes
							if(err.response.status == 429) {
								this._debug(`Route RateLimited freezing the Route, setting resetTime to ${parseInt(err.response?.headers['X-Rate-Limit-Reset']) * 1000} ms`)
								this.rateLimit.limited = true;
								this.frozen = true;
								this.updateRateLimitInfo(err?.response?.headers)
		
								setTimeout(() => {
									this._debug(`Rate limit passed, continuing the request queue`)
									this.frozen = false;
									this.rateLimit.limited = false;
									this.queue.shift();
								}, parseInt(err.response?.headers['X-Rate-Limit-Reset']) * 1000)
								
								if(stopped) return;
								else reject(`Rate Limited, :: ${util.inspect(err?.response?.headers)}`)
							}
							return reject(this._parseResponse(err.response))
					}
					reject(this._parseResponse(err))
				});
			});
		});
	}
	_resolveRequest({ method = RequestMethods.GET, endPoint = this.endPoint, bodyOrParams = {} }) {
		const finalData: requestResolved = {
			endpoint: endPoint,
			params: {},
			body: {},
			url: this.baseURL,
			method: method,
		};
		if(method === RequestMethods.GET) {
			const endPointSplit = endPoint.split('/')

			endPointSplit.forEach((part) => {
				const partSplit: any = part.split(':');
				// @ts-ignore 
				const param = bodyOrParams[partSplit[1]];
				if(param && param !== null) {
					// @ts-ignore 
					delete bodyOrParams[partSplit[1]];
	
					finalData.endpoint = finalData.endpoint.replace(part, param);
				}
			});

			finalData.params = bodyOrParams
			finalData.url = finalData.url + `${finalData.endpoint}${this.restManager._client.version == '1' ? '.json' : ''}`
			if(!isObjectEmpty(bodyOrParams)) {
				finalData.url = finalData.url + '?' + new URLSearchParams(bodyOrParams).toString()
			}
		}
		else if(method === RequestMethods.POST) {
			const endPointSplit = endPoint.split('/')

			endPointSplit.forEach((part) => {
				const partSplit: any = part.split(':');
				// @ts-ignore 
				const param = bodyOrParams[partSplit[1]];
				if(param) {
					// @ts-ignore 
					delete bodyOrParams[partSplit[1]];
	
					finalData.endpoint = finalData.endpoint.replace(part, param);
				}
			});

			finalData.body = bodyOrParams
			finalData.url = finalData.url + `${finalData.endpoint}${this.restManager._client.version == '1' ? '.json' : ''}`
			/*if(!isObjectEmpty(bodyOrParams)) {
				finalData.url = finalData.url + '?' + new URLSearchParams(bodyOrParams).toString()
			}*/
		}
		return finalData;
	}

	_resolveHeaders(resolvedData: requestResolved) {
		const buildData = {
			url: resolvedData.url,
			 // get => GET etc
			method: resolvedData.method,
		}


		if(!isObjectEmpty(resolvedData.body)) {
			// @ts-ignore
			buildData.data = resolvedData.body;
		}
	
		const headers = this.restManager._client.oauthClient.toHeader(
			this.restManager._client.oauthClient.authorize(buildData, this.restManager._client.oauthUserData),
		  );

      return headers;
	}
	_parseResponse(resp: any) {
	    if(typeof resp.toJSON == 'function') return resp.toJSON();
		else return resp?.data || resp;
	}
	updateRateLimitInfo(headers: AxiosResponseHeaders) {
		const xRateLimit = headers['x-ratelimit-limit'];
		const xRateRemain = headers['x-ratelimit-remaining'];
		const xReset = headers['x-ratelimit-reset']

		if(xRateLimit) {
			this.rateLimit.limit = parseInt(xRateLimit);
		}
		if(xRateRemain) {
			this.rateLimit.remaining = parseInt(xRateRemain);
		}
		if(xReset) {
			this.rateLimit.reset = parseInt(xReset);
		}

		this._debug(`RateLimit Info Updated: 
		Limit       : ${xRateLimit} 
		Remaining   : ${xRateRemain}
		Reset		: ${xReset}
		`)

		return this.rateLimit;
	}
}

export default requestBucket;