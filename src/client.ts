import { merge }from "./util/merge";
import { Media, User, Tweet, objectValidation } from "..";
import rest from "./rest/rest";
import { chunkBuffer, mergeBody } from "./util/basic";
import { defaultOptions, RequestMethods } from "./util/constants";
import getOAuthClient from "./util/oauthClient";


interface ClientOptions {
	authorization: {
		consumer_key:  string | null,
		consumer_secret:  string | null,
		access_token:  string | null,
		access_token_secret:  string | null,
	},
	api: {
		version: number | string,
		subdomain: string,
		rateLimits: boolean,
		userAgent: string,
	},
	debug: null | Function,
}

/**
 * Request Options for axios client
 */

export interface requestOptions {
	method?: string; 
	endPoint: string; 
	bodyOrParams: {}; 
	timeOut?: number;
}

/**
 * The core rest Client
 * @param options - Options for the twitter Client
 * @example
 * ```typescript
 * import { Client } from 'tweets.ts'
 * 
 * const client = new Client({
 * debug: (msg) => console.log(msg),
 * authorization: {
 * 	consumer_key: 'qR3vKd535gdhfjt7ffdfsgdq',
 * consumer_secret: 'wAsefweffsfsfefsKWTRfls',
 * access_token: '1234454545oZ866Kan',
 * access_token_secret: 'i366iP633443rewfefef',
 *   }
 * });
 * ```
 */
class Client {
	options: ClientOptions & { authorization: { consumer_key: string | null; consumer_secret: string | null; access_token: string | null; access_token_secret: string | null; }; api: { version: string; subdomain: string; rateLimits: boolean; userAgent: string; }; };
	oauthClient: any;
	auth: { consumer_key: string | null; consumer_secret: string | null; access_token: string | null; access_token_secret: string | null; } & { consumer_key: string | null; consumer_secret: string | null; access_token: string | null; access_token_secret: string | null; };
	oauthUserData: { key: null | string; secret: null | string; };
	debug: Function | null;
	 _rest: rest;
	version: string;
	constructor(options: ClientOptions) {
		this.options = merge(defaultOptions, options)
		this.auth = this.options.authorization;
		this.oauthClient = getOAuthClient(this.options.authorization.consumer_key, this.options.authorization.consumer_secret);
		this.oauthUserData = {
			key: this.auth.access_token,
			secret: this.auth.access_token_secret,
		}
		this.debug = this.options.debug
		this._rest = new rest(this)
		this.version = this.options.api.version == '1.1' ? '1' : '2';
	}
	private _request(obj: requestOptions) {
		return this._rest._request(obj);
	}
	/**
	 * GET request to the twitter api
	 * @param obj - Request Config for rest manager
	 * @returns Raw json response or a Error
	 * @example
	 * ```typescript
	 * // get request to "/followers/list"
	 * bot.get({ endPoint: '/followers/list', bodyOrParams: { screen_name: 'typicalninja' } }).then(console.log).catch(console.log);
	 * ```
	 */
	get(obj: requestOptions): Promise<any> {
		return this._request({ method: RequestMethods.GET, ...obj })
	}
	/**
	 * POST request to the twitter api
	 * @param obj - Request Config for rest manager
	 * @returns Raw json response or a Error
	 * @example
	 * ```typescript
	 * // post request to "/statuses/update"
	 * bot.post({ endPoint: '/statuses/update', bodyOrParams: { status: 'Tweets.js is the best library' } }).then(console.log).catch(console.log);
	 * ```
	 */
	post(obj: requestOptions) {
		return this._request({ method: RequestMethods.POST, ...obj })
	}
	/**
	 * Get a Users Followers, only the first page, use getManyFollowers for more pages
	 * @param user - User Screen name or id to fetch followers of
	 * @param options - Options for getFollowers method
	 * @returns - Array of Users
	 * @example
	 * ```typescript
	 * // get 20 of user's Follower's
	 * bot.getFollowers('typicalninja', { count: 20 }).then(console.log).catch(console.log)
	 * ```
	 */
	getFollowers(user: string, options = { count: 10, noStatus: false, cursor: -1 }): Promise<{ next_cursor: number, previous_cursor: number, users: User[] }> {
		if(!user || typeof user !== 'string' && typeof user !== 'number') throw new Error('User id/Screen name is invalid / missing')
		objectValidation(options, { count: 'number', noStatus: 'boolean' })
		const parameters: {} = {};
		// user can use a screen_name or a user_id to get followers
		if(isNaN(parseInt(user))) Object.defineProperty(parameters, 'screen_name',  { value: user, configurable: true, writable: false, enumerable: true });
		else Object.defineProperty(parameters, 'user_id',  { value: user, configurable: true, writable: false, enumerable: true });
		// max Numbers of results to get, defaults to 10
		if(options.count < 200 && options.count > 0) Object.defineProperty(parameters, 'count',  { value: options.count, configurable: true, writable: false, enumerable: true });
		if(!isNaN(options.cursor)) Object.defineProperty(parameters, 'cursor',  { value: options.cursor, configurable: true, writable: false, enumerable: true });
		return new Promise((resolve, reject) => {
			this.get({ endPoint: '/followers/list', bodyOrParams: parameters, timeOut: 15000 }).then((apiData) => {
				const users = apiData.users;
				const parsedUsers = []
				for (user of users) parsedUsers.push(new User(this, user))
				const values = {
					next_cursor: apiData.next_cursor,
					previous_cursor: apiData.previous_cursor,
					users: parsedUsers,
				}
				return resolve(values);
			}).catch((err) => {
				reject(err)
			})
		});
	}
	/**
	 * Get a Users Followers, Gets multiple pages, sends requests over and over, limit use of this
	 * @param user - User Screen name or id to fetch followers of
	 * @param  options - Options for getManyFollowers method
	 * @returns Array's inside A Array, containing (page) amount of Users in each Array
	 * @example
	 * ```typescript
	 * // get 3 pages of users with 10 users each for a particular user
	 * bot.getManyFollowers('typicalninja', { pages: 3, page: { count: 10  } })
	 * ```
	 */
	getManyFollowers(user: string, options = { pages: 2, page: { count: 10, noStatus: false, cursor: -1 } }): Promise<User[][]> {
		if(!user || typeof user !== 'string' && typeof user !== 'number') throw new Error('User id/Screen name is invalid / missing');
		objectValidation(options, { pages: 'number', page: { count: 'number', noStatus: 'boolean', cursor: 'number' } });
		// good idea to limit the user to get 10 pages max
		if(options.pages > 10) throw new Error('Cannot fetch more than 10 pages at once');
		return new Promise((resolve, reject) => {
				this.getFollowers(user, options.page).then((firstRequest) => {
					const parsedUsers = [];
					parsedUsers.push(firstRequest.users)
					let nextCursor = firstRequest.next_cursor;

					for(let i = 1; i <= options.pages;i++) {
						const newOptions = { cursor: nextCursor,  count: options.page.count, noStatus: options.page.noStatus };
						this.getFollowers(user, newOptions).then((req) => {
							parsedUsers.push(req.users);
							nextCursor = req.next_cursor;
						}).catch((err) => reject(err))
					}
					resolve(parsedUsers);
				})
				.catch((err) => {
					reject(err);
				})
		});
	}
	/**
	 * Get multiple tweets
	 * @param tweetIds - Array of tweet ids to get
	 * @param parameters - custom parameters for this GET Request
	 */
	getTweets(tweetIds = [], parameters: {}): Promise<Tweet[]> {
		if(!Array.isArray(tweetIds)) throw new Error('TweetIds must be a Array');
		const joinedArray = tweetIds.join(",");
		const params = mergeBody({
			id: joinedArray,
		}, parameters);
		return new Promise((resolve, reject) => {
			this.get({ endPoint: '/statuses/lookup', bodyOrParams: params }).then(r => {
				if(r.length <= 0) resolve([]);
				const tweets = [];
				for(const tweet of r) {
					tweets.push(new Tweet(this, tweet))
				}
				resolve(tweets)
			}).catch(reject)
		})
	}
	/**
	 * Tweet a message
	 * @param status - Message to Tweet
	 * @param body - custom body for this POST request
	 * @returns A tweet, containing all the usual tweet functions
	 * @example
	 * ```typescript
	 * // tweet a message "hey, this is a tweet from tweets.js"
	 * bot.tweet('hey, this is a tweet from tweets.js')
	 * ```
	 */
	tweet(status: string, mbody: {}): Promise<Tweet> {
		if(typeof status !== 'string') throw new Error('Status is A Required value that needs to be a string')
		if(mbody && typeof mbody !== 'object') throw new Error('body must be a object');
		// since there are lots of body parameters for this route, we let the user decide the body
		const body = mergeBody({
			status: status,
		}, mbody);
		return new Promise((resolve, reject) => {
			this.post({ bodyOrParams: body, endPoint: '/statuses/update' }).then((apiData) => {
				resolve(new Tweet(this, apiData))
			}).catch((err) => reject(err))
		});
	}

	/**
	 * Reply to a tweet
	 * @param tweetID - Id of the tweet to reply to
	 * @param reply - Message to Reply with
	 * @param body - custom body for this POST request
	 * @returns A tweet, containing all the usual tweet functions
	 * @example
	 * ```typescript
	 * // reply to a tweet with message "Hey have you used tweets.js?"
	 * bot.reply('12232455799', 'Hey have you used tweets.js?')
	 * ```
	 */
	reply(tweetID: string, reply: string, mbody: {}): Promise<Tweet> {
		const bd = {
			in_reply_to_status_id: tweetID,
			auto_populate_reply_metadata: true,
		}
		const body = mergeBody(bd, mbody)

		return this.tweet(reply, {
			body: body,
		})
	}

	/**
	 * Retweet a tweet
	 * @param  tweetID - Id of the tweet to retweet
	 * @returns  A tweet, containing all the usual tweet functions
	 * @example
	 * ```typescript
	 * // retweet the tweet with id "12233445566"
	 * bot.retweet('12233445566').then(console.log).catch(console.log)
	 * ```
	 */
	retweet(tweetID: string): Promise<Tweet> {
		if(!tweetID || typeof tweetID !== 'string') throw new Error(`Tweet id must be preset / be a string to retweet`);
		return new Promise((resolve, reject) => {
			// our parser will replace :tweetID with one in bodyOrParams, for dynamic urls, use this method, or it will create a request bucket for that
			this.post({ endPoint: '/statuses/retweet/:tweetID', bodyOrParams: { tweetID: tweetID } }).then((apiData) => {
				resolve(new Tweet(this, apiData));
			}).catch(reject);
		});
	}

	/**
	 * Follows a user
	 * @param user - Users id / screen name or user object to follow
	 * @param enableNotifications - if true, sends api param follow set to true, enables notifications for the followed user
	 * @example 
	 * ```typescript
	 * bot.follow('11112124234').then(console.log).catch(console.log)
	 * ```
	 */
	follow(user: string | User, enableNotifications: Boolean = true): Promise<User> {
		if(!user || typeof user !== 'string' && typeof user !== 'number' && !(user instanceof User)) throw new Error('User id/Screen name is invalid / missing');
		if(user instanceof User) user = user.id;
		const parameters: {} = {};
		// user can use a screen_name or a user_id to get followers
		if(isNaN(parseInt(user))) Object.defineProperty(parameters, 'screen_name',  { value: user, configurable: true, writable: false, enumerable: true });
		else Object.defineProperty(parameters, 'user_id',  { value: user, configurable: true, writable: false, enumerable: true });
		
		if(enableNotifications) Object.defineProperty(parameters, 'follow',  { value: true, configurable: true, writable: false, enumerable: true });
		else Object.defineProperty(parameters, 'follow',  { value: false, configurable: true, writable: false, enumerable: true });
		return new Promise((resolve, reject) => {
			this.post({ endPoint: '/friendships/create', bodyOrParams: parameters }).then(r => {
				resolve(new User(this, r))
			}).catch(reject);
		});
	}

	/**
	 * Unfollow's a user
	 * @param user - user to unfollow
	 * @example
	 * ```typescript
	 * bot.unfollow('1121212121').then(console.log).catch(console.log)
	 * ```
	 */
	unfollow(user: string | User): Promise<User>  {
		if(!user || typeof user !== 'string' && typeof user !== 'number' && !(user instanceof User)) throw new Error('User id/Screen name is invalid / missing');
		if(user instanceof User) user = user.id;
		const parameters: {} = {};
		// user can use a screen_name or a user_id to get followers
		if(isNaN(parseInt(user))) Object.defineProperty(parameters, 'screen_name',  { value: user, configurable: true, writable: false, enumerable: true });
		else Object.defineProperty(parameters, 'user_id',  { value: user, configurable: true, writable: false, enumerable: true });
		return new Promise((resolve, reject) => {
			this.post({ endPoint: '/friendships/destroy', bodyOrParams: parameters }).then(r => {
				return resolve(new User(this, r));
			}).catch(reject);
		});
	}
	/**
	 * Search multiple users 
	 * @param query - query to search for
	 * @example
	 * ```typescript
	 * bot.searchUsers('soccer', { count: 20,  }).then(console.log).catch(console.log)
	 * ```
	 */
	searchUsers(query: string, parameters: { } = {}): Promise<User[]> {
		if(!query || typeof query !== 'string') throw new Error('Query is required and must be a string');
		if(parameters && typeof parameters !== 'object') throw new Error('Parameters must be an object');
		const params = mergeBody({
			q: query,
		}, parameters);

		return new Promise((resolve, reject) => {
			this.get({ endPoint: '/users/search', bodyOrParams: params }).then((r: []) => {
				resolve(r.map((user: any) => new User(this, user)))
			}).catch(reject);
		})
	}
	// not ready to release
	private async tweetMedia(media: Media | string | Buffer) {
		let attachment;
		// if its a Media Class, just convert it to json
		if(media instanceof Media) {
			attachment = await media.toJson().catch((err) => { throw err })
		}
		else {
			// if not, get the Media from Given buffer, or url (can include raw base64 data of a image), sadly we will use the normal method, users will have to set this on own if needed to change method
			attachment = await (new Media(media)).setMethod('normal').toJson().catch((err) => { throw err })
		}

		const mediaID = attachment.method == 'chunk' ? await this._uploadChunk(attachment) : await this._uploadNormal(attachment);


		return await this.post({ endPoint: '/statuses/update', bodyOrParams: { status: attachment.tweet, media_ids: mediaID  } }).catch((err) => { throw err });
	}
	private async _uploadNormal(attachment: any) {
		const imageRequest = await this.post({ endPoint: '/media/upload', bodyOrParams: { media_data: attachment.media } }).catch((err) => { throw err });
		const mediaIdStr = imageRequest.media_id_string;
		if(attachment.altText) {
			const altText = attachment.altText;
			await this.post({ endPoint: '/media/metadata/create', bodyOrParams: { media_id: mediaIdStr, alt_text: { text: altText } } }).catch((err) => { throw err })
		}

		return mediaIdStr;
	}
	private async _uploadChunk(attachment: any) {
		const { buffer, buffers } = chunkBuffer(attachment.rawBuffer)
		// buffer is a Buffer, duh
		const totalBytes = Buffer.byteLength(buffer.toString('binary'));
		const initCmd = await this.post({ endPoint: '/media/upload', bodyOrParams: {  command: "INIT", total_bytes: totalBytes, media_type: attachment.mediaType } }).catch((err) => { throw err });
		const mediaIdStr = initCmd.media_id_string;
		let sentBytes = 0;
		let segMentId = 0;
		while (sentBytes < totalBytes) {
			const chunk = buffers[segMentId] as Buffer
			if(chunk) {
				const chunkBinary = chunk.toString('binary')
				sentBytes += Buffer.byteLength(chunkBinary);
				 console.log(`SegmentID: ${segMentId}; SentBytes/total-bytes: ${sentBytes}-B/${totalBytes}-B; ${chunk.length}`)
				await this.post({ endPoint: '/media/upload', timeOut: 40000, bodyOrParams: {  command: "APPEND", media_id: mediaIdStr, media: chunkBinary, segment_index: segMentId } }).catch((err) => { throw err });
				segMentId++
			}
		}
		console.log(`SentBytes/total-bytes: ${sentBytes}-B/${totalBytes}-B; Last Segment: ${segMentId}`)
		await this.post({ endPoint: '/media/upload', bodyOrParams: {  command: "FINALIZE", media_id: mediaIdStr } }).catch((err) => { throw err });

		return mediaIdStr;
	}
}


export default Client;