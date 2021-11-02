import Client from "../client";

/**
   * Represents a user
   * @param {Client} client - tweets.js client
   * @param {*} apiData - Raw [User Object](https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/user) from twitter api
*/
class User {
	private _apiData: any;
	/**
	* Tweets.js Client
	*/
	client: Client;
	/**
	* Id of this user
	*/
	id: string;
	/**
	* username of this user
	*/
	username: string;
	/**
	* Date when the user created the Account, apiData date converted to js [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
	*/
	createdAt: Date;
	/**
	 * Users screen name
	 */
	screenName: string;
	/**
	 * Number of followers this user has
	 */
	followers: number;
	/**
	 * Number of Liked Posts this user has
	 */
	likedPosts: number;
	/**
	 * Number of Friends this user have
	 */
	friends: number;
	/**
	 * Https avatar url of this user
	 */
	avatarUrl: string;
	/**
	 * Https Banner Url of this user
	 */
	bannerUrl: string;
	/**
	 * Default icon of this user
	 */
	defaultImg: string;
	/**
	 * When true, indicates that the user has a verified account. See [Verified Accounts](https://help.twitter.com/en/managing-your-account/about-twitter-verified-accounts).
	 */
	verified: boolean;
	/**
	 * Direct link to user, https://twitter.com/ joined with users screen name
	 */
	profileURL: string;
	/**
	 * When true, indicates that this user has chosen to protect their Tweets. See [About Public and Protected Tweets](https://support.twitter.com/articles/14016-about-public-and-protected-tweets)
	 */
	tweetsProtected: boolean;
	/**
	 * A URL provided by the user in association with their profile.
	 */
	URL: string | null;
	constructor(client: Client, apiData: any) {
		this.client = client;
		this._apiData = apiData;

		// user related Data

		// use id_str cause the id in integer might be too large for js
		this.id = apiData.id_str;
		this.username = apiData.name;
		this.createdAt = new Date(apiData.created_at);
		this.screenName = apiData.screen_name;

		this.followers = parseInt(apiData.followers_count);
		this.likedPosts = parseInt(apiData.favourites_count);
		this.friends = parseInt(apiData.friends_count);


		// user avatar related
		this.avatarUrl = apiData.profile_image_url_https;
        this.bannerUrl = apiData.profile_background_image_url_https;
        this.defaultImg = apiData.default_profile_image;

		this.verified = Boolean(apiData.verified);
		// DEPRECATED this.followed = Boolean(apiData.following);
		this.tweetsProtected = Boolean(apiData.protected)

		this.profileURL = `https://twitter.com/${this.screenName}`;
		this.URL = apiData.url
	}
	getFollowers(options = { pages: 2, page: { count: 20, noStatus: true, cursor: -1 } }) {
		return this.client.getManyFollowers(this.id, { pages: options.pages, page: options.page })
	}
	/**
	 * follows this user, alias function to main client "follow()"
	 * @param enableNotifications - if true, sends api param follow set to true, enables notifications for the followed user
	 */
	follow(enableNotifications: Boolean = true) {
		return this.client.follow(this.id, enableNotifications);
	}
	/**
	 * Unfollow's this user, alias function to main client "unfollow()"
	 */
	unfollow() {
		return this.client.unfollow(this.id);
	}
}

export default User;