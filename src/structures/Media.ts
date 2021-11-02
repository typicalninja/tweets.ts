import { isUrl } from "../util/basic";
import axios from "axios";


/**
 * Represents twitter Media Attachment, includes twitter message, 
 * @param {Buffer | string} media - Buffer, url to image, base64 string
 * @example <caption>Using url to a image</caption>
 * ```typescript
 * import { Media } from 'tweets.ts';
 * 
 * const attachment = new Media('https://path.com/to/image.png')
 * ```
 * @example <caption>Using a Base64 String</caption>
 * ```typescript
 * import { Media } from 'tweets.ts';
 * 
 * // get a base64 image data somehow, this uses "fs"
 * const b64Image = fs.readFileSync('path/to/image.png', { encoding: "base64" });
 * const attachment = new Media(b64Image)
 * ```
 * @example <caption>Using a Buffer</caption>
 * ```typescript
 * import { Media } from 'tweets.ts';
 * 
 * const buffer = fs.readFileSync('path/to/image.png');
 * const attachment = new Media(buffer);
 * ```
 * @example <caption>Sending a tweet with Media</caption>
 * ```typescript
 * import { Media, Client } from 'tweets.ts';
 * // look below for method specific examples
 * const client = new Client({
 *	authorization: {
 *		consumer_key: 'your Consumer Key',
 *		consumer_secret: 'Consumer Secret',
 *		access_token: 'Your access token',
 *		access_token_secret: 'Your access token secret',
	}
});
 * const buffer = // ...get buffer some how
 * const attachment = new Media(buffer);
 * client.tweetMedia(attachment).then(console.log).catch(console.log)
 * ```
 */
class Media {
	rawMedia: Buffer | string;
	private _downloadedMedia: null | string;
	tweetText: string | null;
	altText: string | null;
	method: string;
	mediaType: string;
	rawBuffer: Buffer | null;
	constructor(media: Buffer | string) {
		if(typeof media !== 'string' && !Buffer.isBuffer(media)) throw new Error(`Media must be a base64 image data, url to image or a buffer, received ${typeof media}`)
		/**
		 * User Provided Raw Data, buffer, url to image, base64 string
		 * @type {Buffer | string}
		 */
		this.rawMedia = media;
		this._downloadedMedia = null;
		this.rawBuffer = null

		this.altText = null;
		this.tweetText = null;
		// wether to use the chunk method to or the normal method
		this.method = 'chunked';
		this.mediaType = 'image/png'
	}
	/**
	 * Gets a base64 string of the 
	 * @returns {Promise<string>}
	 */
	async getBase64(): Promise<string> {
		if(Buffer.isBuffer(this.rawMedia)) return this.rawMedia.toString('base64');
		if(isUrl(this.rawMedia)) {
			// no need to download it over and over, kinda stupid to do that
			if(this._downloadedMedia) return this._downloadedMedia;
			const buf = await this._download();
			this._downloadedMedia = buf.toString('base64');

			return this._downloadedMedia;
		}

		// assume its already a base64 string
		return this.rawMedia;
	}
		/**
	 * Get raw binary data of this media
	 * @returns {Promise<string>}
	 */
		 async getBinary(): Promise<string> {
			if(Buffer.isBuffer(this.rawMedia)) {
				this.rawBuffer = this.rawMedia;
				return this.rawMedia.toString('binary');
			}
			if(isUrl(this.rawMedia)) {
				// no need to download it over and over, kinda stupid to do that
				if(this._downloadedMedia) return this._downloadedMedia;
				const buf = await this._download();
				this.rawBuffer = buf;
				this._downloadedMedia = buf.toString('binary');
				
				return this._downloadedMedia;
			}
	
			// assume its already a binary string
			this.rawBuffer = Buffer.from(this.rawMedia, 'binary');
			return this.rawMedia;
		}
	/**
	 * Download a image from a url, if its a url
	 * @returns {Promise<Buffer>}
	 */
	_download(): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			axios.get(this.rawMedia as string, { responseType: 'arraybuffer' }).then((response) => {
				// @ts-ignore
			  resolve(Buffer.from(response.data, 'binary'))
			}).catch(reject)
		});
	}
	/**
	 * Set the tweet for this message
	 * @returns {Media}
	 * @example
	 * ```typescript
	 * import { Media } from 'tweets.ts'
	 * 
	 * const buffer = // ...get a buffer some how
	 * const attachment = new Media(buffer);
	 * attachment.setTweet('hey this attachment is send from tweet.js');
	 * ```
	 */
	setTweet(tweet: string): this {
		if(typeof tweet !== 'string') throw new Error(`Tweet for setTweet must be a string`);
		this.tweetText = tweet;
		return this;
	}
	/**
	 * Sets the media type, useful for chunk uploads
	 * @returns {Media}
	 * @example
	 * ```typescript
	 * import { Media } from 'tweets.ts'
	 * 
	 * const buffer = // ...get a buffer some how
	 * const attachment = new Media(buffer);
	 * 
	 * attachment.setMediaType('image/jpeg');
	 * ```
	 */
	setMediaType(type: string) {
		this.mediaType = type;
		return this;
	}
	/**
	 * Set the Alt text for this message
	 * @returns {Media}
	 * @example
	 * ```typescript
	 * import { Media } from 'tweets.ts'
	 * 
	 * const buffer = // ...get a buffer some how
	 * const attachment = new Media(buffer);
	 * attachment.setAltText('A Tweet Sent with tweets.js');
	 * ```
	 */
	setAltText(altText: string): this {
		if(typeof altText !== 'string') throw new Error(`altText for setAltText must be a string`);
		this.altText = altText;
		return this;
	}

	/**
	 * Set method on which the client will upload the image to twitter api, normal only supports images (chunk is broken, for now)
	 * @param method - either chunk or normal
	 * @example
	 * ```typescript
	 * import { Media } from 'tweets.ts'
	 * 
	 * const buffer = // ...get a buffer some how
	 * const attachment = new Media(buffer);
	 * attachment.setMethod('chunk');
	 * ```
	 */
	setMethod(method: string): this {
		if(!['chunk', 'normal'].includes(method)) throw new Error(`Method must be either chunk or normal`)
		this.method = method;
		return this;
	}

	/**
	 * Get a object representation of the Media class
	 */
	async toJson(): Promise<{ media: string, altText: string | null, tweet: string | null, method: string, mediaType: string, rawBuffer: Buffer }> {
		return {
			media: this.method == 'chunk' ? await this.getBinary() : await this.getBase64(),
		    altText: this.altText,
			tweet: this.tweetText,
			method: this.method,
			mediaType: this.mediaType,
			rawBuffer: this.rawBuffer as Buffer
		};
	}
}

export default Media;