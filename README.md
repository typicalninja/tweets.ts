
# Deprecated

[Read](https://github.com/typicalninja493/tweets.ts/issues/4)

<h1 align="center">Welcome to tweets.ts 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.2-blue.svg?cacheSeconds=2592000" />
  <a href="https://tweets.axix.cf/" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
  <a href="https://twitter.com/typicalninja69" target="_blank">
    <img alt="Twitter: typicalninja69" src="https://img.shields.io/twitter/follow/typicalninja69.svg?style=social" />
  </a>
</p>

> A easy to use twitter api client

> Tweets.ts is a continuation of project [Tweets.js](https://www.npmjs.com/package/tweets.js), rewritten in typescript, from now on, use tweets.ts **instead** of tweets.js (tweets.js will be deprecated in favour of this)

### 🏠 [Homepage](https://tweets.axix.cf/)

## Install

```sh
npm i tweets.ts
```


## Usage

### Typescript

#### RestClient


```ts
import { Client } from 'tweets.ts';

const client = new Client({
  authorization: {
    consumer_key: 'Your Consumer Key',
    consumer_secret: 'Your Consumer Secret',
    access_token: 'Your access Token',
    access_token_secret: 'Your Access Token Secret',
  }
});

//... do what ever you want, use tweets.axix.cf for docs
// this is a example

client.getFollowers('typicalninja69', {  count: 20 }).then(res => console.log('Here is typicalninja\'s Followers', res)).catch(err => console.log('error occurred', err));
```


#### StreamClient

```ts
import { StreamClient, Tweet } from 'tweets.ts'

// or...

import { StreamClient, Client, Tweet } from 'tweets.ts'



// if passing the whole client to streamClient (recommended)
const client = new Client({
  authorization: {
    consumer_key: 'Your Consumer Key',
    consumer_secret: 'Your Consumer Secret',
    access_token: 'Your access Token',
    access_token_secret: 'Your Access Token Secret',
  }
});


// ... if passing whole Client to streamClient (recommended)
 const streamClient = new StreamClient(client)

/*
else....

 const streamClient = new StreamClient({
  authorization: {
    consumer_key: 'Your Consumer Key',
    consumer_secret: 'Your Consumer Secret',
    access_token: 'Your access Token',
    access_token_secret: 'Your Access Token Secret',
  }
 })
*/

// this is a must
streamClient.stream({ endPoint: '/statuses/filter', body: { follow: "1238451949000888322", } });

streamClient.on('connected', () => {
    console.log('Stream Client is now Connected')
});

streamClient.on('end', (reason: string) => {
  console.log('Stream Ended due to:', reason)
});

streamClient.on('tweet', (tweet: Tweet) => {
  console.log('New Tweet:')
  console.log(tweet)
});

// to end this client
setTimeout(() => {
  streamClient.end('Time ended, we don\'t need a stream now');
}, 10000)
```

### JavaScript

#### RestClient

```js
const { Client } = require('tweets.ts');
const client = new Client({
   authorization: {
    consumer_key: 'Your Consumer Key',
    consumer_secret: 'Your Consumer Secret',
    access_token: 'Your access Token',
    access_token_secret: 'Your Access Token Secret',
  }
});

//... do what ever you want, use tweets.axix.cf for docs
// this is a example

client.getFollowers('typicalninja69', {  count: 20 }).then(res => console.log('Here is typicalninja\'s Followers', res)).catch(err => console.log('error occurred', err));
 
```


#### StreamClient

```js
const { StreamClient } = require('tweets.ts');

// or...
const { StreamClient, Client } = require('tweets.ts')

// if passing the whole client to streamClient (recommended)
const client = new Client({
  authorization: {
    consumer_key: 'Your Consumer Key',
    consumer_secret: 'Your Consumer Secret',
    access_token: 'Your access Token',
    access_token_secret: 'Your Access Token Secret',
  }
});


// ... if passing whole Client to streamClient (recommended)
 const streamClient = new StreamClient(client)

/*
else....

 const streamClient = new StreamClient({
  authorization: {
    consumer_key: 'Your Consumer Key',
    consumer_secret: 'Your Consumer Secret',
    access_token: 'Your access Token',
    access_token_secret: 'Your Access Token Secret',
  }
 })
*/

// this is a must
streamClient.stream({ endPoint: '/statuses/filter', body: { follow: "1238451949000888322", } });

streamClient.on('connected', () => {
    console.log('Stream Client is now Connected')
});

streamClient.on('end', (reason) => {
  console.log('Stream Ended due to:', reason)
});

streamClient.on('tweet', (tweet) => {
  console.log('New Tweet:')
  console.log(tweet)
});

// to end this client
setTimeout(() => {
  streamClient.end('Time ended, we don\'t need a stream now');
}, 10000)
```


## Using the raw Api

> Raw api is querying the api using builtin methods like post(), get(), you completely controls these methods. so least support is given for usage of this 

> client is a instance of tweet.ts client
### Get
```typescript
// returns a promise, must be inside a async function, unless you use .then

const request = await client.get({ endPoint: '/endPoint/here/:id', bodyOrParams: { id: 'this will be in the endpoint param', someOtherParam: 'follow' } })

// raw json data
console.log(request);
```

### Post
```typescript
// returns a promise, must be inside a async function, unless you use .then

const request = await client.post({ endPoint: '/endPoint/here/to/post/:id', bodyOrParams: { id: 'this will be in the endpoint param', someOtherBody: 'this will be in the body' } })

// raw json data
console.log(request);
```

## FAQ

* How Do i get Authorization credential's

> See this url : [Click here](https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api)

* How can i use bearer token (app authentication)

> Sadly you cant, in typescript rewrite (tweets.ts) App authentication support was removed, You can use another library like [this one](https://www.npmjs.com/package/twitter) for app authentication purpose

* Where can i get support?

> You can use our Discord server to get support, join [here](https://discord.com/invite/HVnGtzMaW4)

> Or you can use our github issue tracker, [here](https://github.com/typicalninja493/tweets.ts/issues)

**Due to me (typicalninja) Not being available A Github Issue is more convenient if you need support**

## License

This repository and the code inside it is licensed under the MIT License. Read [LICENSE](https://github.com/typicalninja493/tweets.ts/blob/master/LICENSE) for more information.

## Author

👤 **typicalninja21**

* Twitter: [@typicalninja69](https://twitter.com/typicalninja69)
* Github: [@typicalninja493](https://github.com/typicalninja493)

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
