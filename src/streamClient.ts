import { Client, objectValidation, Tweet } from "..";
import { streamUrl, userAgent } from "./util/constants";
import getOAuthClient from "./util/oauthClient";
import isObjectEmpty from 'lodash.isempty'
import axios from "axios";
import { percentEncode } from "./util/basic";


const END = "\r\n";

let EventEmitter;
// optional package eventemitter3
try {
  EventEmitter = require("eventemitter3");
} catch {
  EventEmitter = require("events");
}

const fillClient = (self: any, clientOrOptions: Client | { version: string | number, authorization: { consumer_key: string | null; consumer_secret: string | null; access_token: string | null; access_token_secret: string | null; } & { consumer_key: string | null; consumer_secret: string | null; access_token: string | null; access_token_secret: string | null; } }) => {
	if(clientOrOptions instanceof Client) {
		Object.defineProperties(self, {
			oauthClient: {
				value: clientOrOptions.oauthClient,
				enumerable: true,
				configurable: true,
			},
			oauthUserData: {
				value: clientOrOptions.oauthUserData,
				enumerable: true,
				configurable: true,
			},
			version: {
				value: clientOrOptions.version,
				enumerable: true,
				configurable: true,
			},
			client: {
				value: clientOrOptions,
				enumerable: true,
				configurable: true,
			}
		})
		return self;
	}
	else {
		objectValidation(clientOrOptions, { version: 'number', authorization: { consumer_key:'string', consumer_secret: 'string', access_token: 'string', access_token_secret: 'string', } });
		Object.defineProperties(self, {
			oauthClient: {
				value: getOAuthClient(clientOrOptions.authorization.consumer_key, clientOrOptions.authorization.consumer_secret),
				enumerable: true,
				configurable: true,
			},
			oauthUserData: {
				value: { key: clientOrOptions.authorization.access_token, secret: clientOrOptions.authorization.access_token_secret },
				enumerable: true,
				configurable: true,
			},
			version: {
				value: clientOrOptions.version || '1',
				enumerable: true,
				configurable: true,
			},

		})
		return self;
	}
}


/** 
 * Emitted when the streamClient is connected to the given endPoint
 * @event
 */
 declare function connected(): void; 

 /** 
  * Emitted when any type of error occurs after stream is connected (some errors might get thrown), while connecting errors are thrown
  * @event
  */
  declare function error(err: any): void;
 
 /** 
  * Nothing important, twitter api sent us a ping event
  * @event
  */
 declare function ping(): void; 
 
 
 /** 
  * Emitted when a tweet gets deleted
  * @event
  */
 declare function tweet(tweet: Tweet): void; 
 
 
 /** 
  * Emitted when a tweet gets deleted
  * @event
  */
  declare function tweetDelete(deletedTweet: Tweet): void;
 
 /** 
  * Emitted When A warning from the twitter api is received
  * @event
  */
  declare function warning(packet: any, warning: any): void; 
 /** 
  * Raw Packet data
  * @event
  */
  declare function raw(rawPacket: Buffer, packet: any): void; 
 



/**
 * Client used for twitter stream api, different from normal rest Client
 * @extends EventEmitter
 * @param ClientOrOptions - tweets.ts Client or a Object with all the authorization fields  accepts both
 * @example <caption>Using a Tweets.ts Client (recommended)</caption>
 * ```typescript
 * import { StreamClient, Client } from 'tweets.ts'
 * 
 * const client = new Client(...Ur Client options here)
 * // client is a tweets.ts Client
 * const streamclient = new StreamClient(client);
 * ```
 * @example <caption>Using a Object with authorization values</caption>
 * ```typescript
 * import { StreamClient } from 'tweets.ts'
 * // version is optional and defaults to "1"
 * const streamclient = new StreamClient({ 
 * version: '1', 
 * authorization: { 
 * 	consumer_key: '1221112321', 
 *	consumer_secret: 'some-value', 
 * 	access_token: 'access token here', 
 * 	access_token_secret: 'access token secret here'  
 * 		} 
 * });
 * ```
 */
class StreamClient extends EventEmitter {
	endPoint: null | string;
	connection: any;
	reconnect: boolean;
	/* All the Client events for typedoc */
	/**
     * Emitted when the streamClient is connected to the given endPoint
     * @event
     */
	static readonly connected = 'connected';
	 /**
     * Emitted when any type of error occurs after stream is connected (some errors might get thrown), while connecting errors are thrown (error will be a param of the event)
     * @event
     */
	static readonly error = 'error';
	/**
     * Nothing important, twitter api sent us a ping event
     * @event
     */
	static readonly ping = 'ping';
	/**
     * Emitted when a tweet gets deleted, with a {@link Tweet} as a param
     * @event
     */
	static readonly tweet = 'tweet'
	/**
     * Emitted when a tweet gets deleted, with a {@link Tweet} as a param
     * @event
     */
	static readonly tweetDelete = 'tweetDelete'
	/**
     * Emitted When A warning from the twitter api is received
     * @event
     */
	static readonly warning = 'warning'
	/**
	 * every data received from the twitter api, params include RawPacket data (buffer) and parsed json data
	 * @event
	 */
	static readonly raw = 'raw'
	constructor(ClientOrOptions: Client | { autoReconnect: boolean, version: string, authorization: { consumer_key: string | null; consumer_secret: string | null; access_token: string | null; access_token_secret: string | null; } & { consumer_key: string | null; consumer_secret: string | null; access_token: string | null; access_token_secret: string | null; } }) {
			super();
			// user can pass a Client object oor a object, containing auth values
			fillClient(this, ClientOrOptions)
			this.endPoint = null;
			this.connection = null;
			this.messageBuffer = '';
			this.ended = false;
			this.reconnect = false;
	}
	private _debug(msg: string) {
		if(this.client && this.client.debug && typeof this.client.debug == 'function') {
			return this.client.debug(`[Stream (end: ${this.endPoint || 'Not Connected'}) => Stream Client] :: ${msg}`)
		}
		else {
			this.emit('debug', `[Stream (end: ${this.endPoint || 'Not Connected'}) => Stream Client] :: ${msg}`)
		}
	}
	/**
	 * Attach A stream to this Stream Client
	 * @param  options - Stream options
	 * @param  reconnect - Weather autoReconnect is enabled
	 * @param options.endPoint - Endpoint to stream to
	 * @param options.body - The body of the request to send to mentioned endpoint
	 * @example <caption>Creating a Stream to '/statuses/filter'</caption>
	 * ```typescript
	 * const body = {
	 * 	follow: "1238451949000888322",
	 * }
	 * 
	 * streamClient.stream({ endPoint: '/statuses/filter', body: body });
	 * 
	 * streamClient.on('connected', () => console.log('connected'))
	 * 
	 * // ... rest of the events here
	 * ```
	 */
	stream({ endPoint = '', body = {}  }, reconnect = this.reconnect) {
		if(typeof endPoint !== 'string') throw new Error(`Endpoint must be a string, received ${typeof endPoint}`);
		if(typeof body !== 'object') throw new Error(`Body must be a object, received ${typeof body}`)
		if(this.endPoint) throw new Error(`[CLIENT_ALREADY_STREAMING] => Your already streaming endPoint: ${this.endPoint} for this Client`)
		const {headers, buildData} = this._resolveHeaders(endPoint, body);
		const requestConfig = {
			method: 'post',
			headers: {
				'user-agent': userAgent,
				...headers
			},
			url: buildData.url,
			responseType: 'stream',
		}
		if(!isObjectEmpty(body)) Object.defineProperty(requestConfig, 'data', { value: percentEncode(new URLSearchParams(body).toString()), enumerable: true, configurable: true })
		const start = Date.now()
		this._debug(`Connecting to Endpoint [${endPoint}] ...`)
		// @ts-ignore
		const StreamConnection = axios(requestConfig);
		StreamConnection.then((response) => {
			if(this.ended) this.ended = false;
			this.endPoint = endPoint;
			this.body = body;
			this.reconnect = reconnect;
			this._debug(`Connected... took ${Date.now() - start}ms`);
			this.emit('connected');
			this.connection = response.data;

			// attach all the events here
			this.connection.on('data', this.onPacket.bind(this));
			this.connection.on('end', this.onEnd.bind(this));
			this.connection.on('error', (err: any) => this.emit('error', err));
		}).catch((err) => {
			console.log(err)
			throw new Error(`Error while Connecting to stream Endpoint:
			Url: ${buildData.url}
			Method: Post
			Err: ${err}
			Body: ${new URLSearchParams(body).toString()}
			`)
		});
	

		return this;
	}
	/**
	 * end this stream
	 * @param reason - reason to end this stream
	 * @param clearEndpoint - Weather to set this.endPoint to null
	 * @example
	 * ```typescript
	 * streamClient.end('We got everything we need from this stream')
	 * ```
	 */
	end(reason = 'No reason', clearEndpoint: boolean) {
		if(this.ended) throw new Error('Stream Already Ended');
		if(!this.endPoint) throw new Error('Stream never connected');
		if(clearEndpoint) {
			this.endPoint = null;
		}
		this.destroy();
		this.ended = true;
		this.connection = null;
		this.emit('end', reason)
		return this;
	}
	/**
	 * Destroy this stream
	 */
	destroy() {
		return this.connection?.destroy();
	}
	private _resolveHeaders(endPoint = this.endPoint, body: any) {
		const buildData = {
			url: `${streamUrl.replace('#{version}', this.version == '1' ? '1.1' : '2')}${endPoint}${this.version == '1' ? '.json' : ''}`,
			method: 'POST',
		}

		if(!isObjectEmpty(body)) Object.defineProperty(buildData, 'data', { value: body, enumerable: true, configurable: true, });
		const headers = this.oauthClient.toHeader(
			this.oauthClient.authorize(buildData, this.oauthUserData)
		  );
		  Object.defineProperty(headers, 'Content-Type', { value: 'application/x-www-form-urlencoded', enumerable: true, configurable: true });

		return { headers, buildData };
	}
	private onEnd() {
		if(this.reconnect) {
			// end this connections left over data
			this.end('Api Disconnected', false)
			// endpoint might not be there
			if(this.endPoint) {
				this._debug(`Auto reconnect Enabled, reconnecting...`)
				return this.stream({ endPoint: this.endPoint, body: this.body })
			}
		}
		else {
			// auto reconnect is NOT enabled, end this connection and its left over data
			return this.end('Api Disconnected', true)
		}
	}
	private onPacket(packetData: Buffer) {
		this._debug(`Packet Received... parsing it now`)
		let packet;

		try {
			packet = this._parsePacket(packetData);
		}
		catch(err) {
			this._debug(`Error while parsing the packet: ${err}`)
		
			this.emit('error', err)
		}
	
		this.emit('raw', packetData, packet)
		// no real packet was received
		if(!packet) return this._debug(`Packet received is not valid ...`);

		// piiiiiiiiiiiiiiiiiiiiiiiing
		if(packet.event == 'ping') { 
			return this.emit('ping'); 
		};

		if (packet.event !== undefined) { 
			return this.emit(packet.event, packet); 
		}
		// its a tweet
		else if(packet.text) { 
	
			return this.emit('tweet', new Tweet(this.client || this, packet)); 
		}
		// its a deleted tweet
		else if(packet.delete) { 
	
			return this.emit('tweetDelete', new Tweet(this.client || this, packet)); 
		}
		// hmm whats his, just send to the user
		else if(packet.warning) { 
	
			return this.emit('warning', packet, packet.warning) 
		}
	}
	private _parsePacket(packetData: Buffer) {
		this.messageBuffer += packetData.toString("utf8");
        let index;
		let jsonData;

		while ((index = this.messageBuffer.indexOf(END)) > -1) {
			jsonData = this.messageBuffer.slice(0, index);
			this.messageBuffer = this.messageBuffer.slice(index + 2);
			if (jsonData.length > 0) {
				try {
					jsonData = JSON.parse(jsonData);
				  return jsonData;
				} catch (error) {
				  throw error;
				}
			  } else {
				  // send Event ping
				return { event: 'ping', data: {} }
			  }
		}
	}
}

export default StreamClient;