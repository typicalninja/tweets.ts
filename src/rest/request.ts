import axios, { AxiosInstance } from 'axios';
import { userAgent } from '../util/constants';
import http from 'http';
import https from 'https'

interface apiOptions {
	version: number | string,
	subdomain: string,
	rateLimits: boolean,
	userAgent: string,
}

function getRequester(apiOptions: apiOptions = { version: '1.1', subdomain: 'api', rateLimits: true, userAgent: userAgent }): { baseUrl: string, instance: AxiosInstance} {
    const baseUrl = `https://${apiOptions.subdomain}.twitter.com/${apiOptions.version}`
	const instance = axios.create({
		//httpAgent: new http.Agent({ keepAlive: true }),
	//	httpsAgent: new https.Agent({ keepAlive: true }),	  
	    baseURL: baseUrl,
		headers: {
     		 Accept: 'application/json',
			'user-agent': apiOptions.userAgent
		}
	});

   return { baseUrl, instance };
}


export default getRequester;