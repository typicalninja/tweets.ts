import axios, { AxiosInstance } from 'axios';
import { userAgent } from '../util/constants';

interface apiOptions {
	version: number | string,
	subdomain: string,
	rateLimits: boolean,
	userAgent: string,
}

function getRequester(apiOptions: apiOptions = { version: '1.1', subdomain: 'api', rateLimits: true, userAgent: userAgent }): { baseUrl: string, instance: AxiosInstance} {
    const baseUrl = `https://${apiOptions.subdomain}.twitter.com/${apiOptions.version}`
	const instance = axios.create({	  
	    baseURL: baseUrl,
		headers: {
     		 Accept: 'application/json',
			'user-agent': apiOptions.userAgent
		}
	});

   return { baseUrl, instance };
}


export default getRequester;