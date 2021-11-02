import Client from "../client";

/**
 * Represents A tweet
 * @param {Client} - tweets.ts client
 * @param {*} apiData - Raw api data from the api
 */
class Tweet {
	client: Client;
	id: string;
	createdAt: Date;
	constructor(client: Client, apiData: any) {
		/**
		 * tweets.ts CLient initiated by the user
		 */
		this.client = client;

		/**
		 * Id of the tweet
		 */
		this.id = apiData.id_str

		this.createdAt = new Date(apiData.created_at);
	}
}

export default Tweet;