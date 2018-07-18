# Talkback

Talkback is a standalone HTTP proxy that can record and playback requests.   
Although built as a node.js library, it can be used to playback requests from any language as you should run it as a separate process.    
Very useful for integration tests environments or mocking HTTP servers.   
Heavily inspired by [flickr/yakbak](https://github.com/flickr/yakbak).   

Read more about the reasoning behind **talkback** on [10Pines blog](https://blog.10pines.com/2017/12/18/isolating-integration-tests-from-external-http-services-with-talkback/).   

[![npm version](https://badge.fury.io/js/talkback.svg)](https://badge.fury.io/js/talkback)
[![Build Status](https://travis-ci.org/ijpiantanida/talkback.svg?branch=master)](https://travis-ci.org/ijpiantanida/talkback)

## Installation

```
npm install talkback
```

## Usage

Talkback is pretty easy to setup.   
Define which host it will be proxying, which port it should listen to and where to find and save tapes.   

When a request arrives to talkback, it will try to match it against an existing tape and return the tape's response.   
If no tape matches the request, it will forward it to the origin host save the tape to disk for future uses and return the response.   

```javascript
const talkback = require("talkback");

const opts = {
  host: "https://api.myapp.com/foo",
  port: 5544,
  path: "./my-tapes"
};
const server = talkback(opts);
server.start(() => console.log("Talkback Started"));
server.close();
```

### talkback(opts)
Returns an unstarted talkback server instance.   

Options:

| Name | Type | Description | Default|   
|------|------|-------------|--------|
| **host** | `String` | Where to proxy unknown requests| |
| **port** | `String` | Talkback port | 8080 |
| **path** | `String` | Path where to load and save tapes | `./tapes/` |
| **ignoreHeaders** | `[String]` | List of headers to ignore when matching tapes. Useful when having dynamic headers like cookies or correlation ids. | `[]` |
| **ignoreQueryParams** | `[String]` | List of query params to ignore when matching tapes. Useful when having dynamic query params like timestamps. | `[]` |
| **ignoreBody** | `Boolean` | Should the request body be considered when matching tapes. | `false` |
| **bodyMatcher** | `Function` | Customize how a request's body is matched against saved tapes. [More info.](#custom-request-body-matcher) | `null` |  
| **record** | `Boolean` | Whether talkback should proxy and record unknown requests. | `true` |
| **fallbackMode** | `String` | Fallback mode for non-recorded requests<ul><li>**404:** Return a 404 error</li><li>**proxy:** Proxy unkonwn request to host</li></ul> | `"404"` |
| **silent** | `Boolean` | Whether to print information console messages in the middle of requests | `false` |
| **summary** | `Boolean` | Whether to print a summary of new and unused tapes at exit | `true` |
| **debug** | `Boolean` | Whether to print verbose debug information | `false` |

### start([callback])
Starts the HTTP server and if provided calls `callback` after the server has successfully started.

### close()
Stops the HTTP server.

## Tapes
Tapes can be freely edited to match new requests or return a different response than the original. They are loaded from the `path` directory at startup.   
They use the [JSON5](http://json5.org/) format. JSON5 is an extensions to the JSON format that allows for very neat features like comments, trailing commas and keys without quotes.   

#### Format
All tapes have the following 3 properties:   
* **meta**: Stores metadata about the tape.
* **req**: Request object. Used to match incoming requests against the tape.
* **res**: Response object. The HTTP response that will be returned in case the tape matches a request.

You can freely edit any part of the tape, and even add your own properties to `meta`.   
Since tapes are only loaded on startup, any changes to a tape requires a server restart to be applied.

#### File Name
New tapes will be created under the `path` directory with the name `unnamed-n.json5`, where `n` is the tape number.   
Tapes can be renamed at will, for example to give some meaning to the scenario the tape represents.

#### Request and Response body
If the content type of the request or response is considered _human readable_ and _uncompressed_, the body will be saved in plain text.      
Otherwise, the body will be saved as a Base64 string, allowing to save binary content.

## No recording
Talkback proxying and recording can be disabled through the `record` option.      
When recording is disabled and an unknown requests arrives, talkback will just log an error message, and return a 404 response without proxying the request to `host`.   

It is recommended to disable recording when using talkback for test running. This way, there are no side-effects and broken tests fail faster.

## Custom request body matcher
By default, in order for a request to match against a saved tape, both request and tape need to have the exact same body.      
There might be cases were this rule is too strict (for example, if your body contains time dependent bits) but enabling `ignoreBody` is too lax.

Talkback lets you pass a custom matching function as the `bodyMatcher` option.   
The function will receive a saved tape and the current request, and it has to return whether they should be considered a match or not.   
Body matching is the last step when matching a tape. In order for this function to be called, everything else about the request should match the tape too (url, method, headers).   
The `bodyMatcher` is not called if tape and request bodies are already the same. 
   
When passing a `bodyMatcher`, `Content-Length` is automatically added to the `ignoreHeaders` list, since you will probably be matching bodies with different sizes.

### Example:

```javascript
function bodyMatcher(tape, req) {
    if (tape.meta.tag === "fake-post") {
      const tapeBody = JSON.parse(tape.req.body.toString());
      const reqBody = JSON.parse(req.body.toString());

      return tapeBody.username === reqBody.username;
    }
    return false;
}
```

In this case we are adding our own `tag` property to the saved tape `meta` property. This way, we are only using the custom matching logic on some specific requests, and can even have different logic for different categories of requests.   
Note that both the tape's and the request's bodies are `Buffer` objects.
  

## Exit summary
If you are using Talkback for your test suite, you will probably have tons of different tapes after some time. It can be difficult to know if all of them are still required.   
To help, when talkback exits, it will print a list of all the tapes that have NOT been used and a list of all the new tapes. If your test suite is green, you can safely delete anything that hasn't been used.
```
===== SUMMARY =====
New tapes:
- unnamed-4.json5
Unused tapes:
- not-valid-request.json5
- user-profile.json5
```
This can be disabled with the `summary` option.

# Licence
MIT
