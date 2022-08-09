import crypto from "crypto";
import OAuth from "oauth-1.0a";

function getOAuthClient(key: string | null, secret: string | null) {
  // consumer key or secret is not set
  if (!key || !secret)
    throw new Error(
      `consumer key / consumer secret needs to be a string, received (key: ${typeof key} / secret: ${typeof secret})`
    );
  return new OAuth({
    consumer: {
      key,
      secret,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, hashKey) {
      return crypto
        .createHmac("sha1", hashKey)
        .update(baseString)
        .digest("base64");
    },
  });
}

export default getOAuthClient;
