import Client from "../client";
import User from "./user";

/**
 * Represents A tweet
 * @param {Client} - tweets.ts client
 * @param {*} apiData - Raw api data from the api
 */
class Tweet {
	client: Client;
	id: string;
	createdAt: Date;
	raw: any;
	user: User | null;
	url: string;
	content: string;
	constructor(client: Client, apiData: any) {
		/**
		 * tweets.ts CLient initiated by the user
		 */
		this.client = client;
		/**
		 * Id of the tweet
		 */
		this.id = apiData.id_str
		/**
		 * Text of the tweet
		 */
		this.content = apiData.text;
		/**
		 * Date when the tweet was created
		 */
		this.createdAt = new Date(apiData.created_at);
		/**
		 * Raw Api Data from the twitter api, unreliable
		 */
		this.raw = apiData;
		/**
		 * User who tweeted this tweet
		 */
		this.user = apiData.user ? new User(client, apiData.user) : null;
		/**
		 * Direct Link to the tweet (Internally Created by tweets.ts, not by twitter api)
		 */
		this.url = this.user ? `https://twitter.com/${this.user.screenName}/status/${this.id}` : `https://twitter.com/status/${this.id}`;

	}
	/**
	 * Reply to this tweet
	 * @param message - Message to be tweeted
	 * @param body - custom body for this request
	 * @returns 
	 */
	reply(message: string, body: {}) {
		if(!message || typeof message !== 'string') throw new Error('Message must be a string');
		if(body && typeof body !== 'object') throw new Error('body must be a object');
		return this.client.reply(this.id, message, body)
	}
	/**
	 * Retweet this tweet
	 * @returns 
	 */
	retweet() {
		return this.client.retweet(this.id);
	}
}

export default Tweet;