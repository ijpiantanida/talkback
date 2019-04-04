# Talkback

Record and playback HTTP requests.   
Talkback is a pure javascript standalone HTTP proxy. As long as you have node.js in your environment, you can run Talkback to record requests from applications written in any language/framework.   
You can use it to accelerate your integration tests or running your application against mocked HTTP servers.       

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

When a request arrives to talkback, it will try to match it against a previously saved tape and quickly return the tape's response.   
If no tape matches the request, it will forward it to the origin host, save the tape to disk for future uses and return the response.   

```javascript
const talkback = require("talkback");

const opts = {
  host: "https://api.myapp.com/foo",
  record: talkback.Options.RecordMode.NEW,
  port: 5544,
  path: "./my-tapes"
};
const server = talkback(opts);
server.start(() => console.log("Talkback Started"));
server.close();
```

### talkback(opts)
Returns an unstarted talkback server instance.   

**Options:**

| Name | Type | Description | Default |   
|------|------|-------------|---------|
| **host** | `String` | Where to proxy unknown requests| |
| **port** | `String` | Talkback port | 8080 |
| **path** | `String` | Path where to load and save tapes | `./tapes/` |
| **https** | `Object` | HTTPS server [options](#https-options) | [Defaults](#https-options) |
| **record** | `String \| Function` | Set record mode. [More info](#recording-modes) | `RecordMode.NEW` |
| **name** | `String` | Server name | Defaults to `host` value |
| **tapeNameGenerator** | `Function` | [Customize](#file-name) how a tape name is generated for new tapes. | `null` |
| **ignoreHeaders** | `[String]` | List of headers to ignore when matching tapes. Useful when having dynamic headers like cookies or correlation ids | `['content-length', 'host]` |
| **ignoreQueryParams** | `[String]` | List of query params to ignore when matching tapes. Useful when having dynamic query params like timestamps| `[]` |
| **ignoreBody** | `Boolean` | Should the request body be ignored when matching tapes | `false` |
| **bodyMatcher** | `Function` | Customize how a request's body is matched against saved tapes. [More info](#custom-request-body-matcher) | `null` |
| **urlMatcher** | `Function` | Customize how a request's URL is matched against saved tapes. [More info](#custom-request-url-matcher) | `null` |
| **responseDecorator** | `Function` | Modify responses before they're returned. [More info](#custom-response-decorator) | `null` |  
| **fallbackMode** | `String \| Function` | Fallback mode for unknown requests when recording is disabled. [More info](#recording-modes) | `FallbackMode.NOT_FOUND` |
| **silent** | `Boolean` | Disable requests information console messages in the middle of requests | `false` |
| **summary** | `Boolean` | Enable exit summary of new and unused tapes at exit. [More info](#exit-summary) | `true` |
| **debug** | `Boolean` | Enable verbose debug information | `false` |

### HTTPS options
| Name | Type | Description | Default |
|------|------|-------------|---------|
| **enabled** | `Boolean` | Enables HTTPS server | `false` |
| **keyPath** | `String` | Path to the key file | `null` | 
| **certPath** | `String` | Path to the cert file | `null` | 

### start([callback])
Starts the HTTP server and if provided calls `callback` after the server has successfully started.

### close()
Stops the HTTP server.

## Tapes
Tapes can be freely edited to match new requests or return a different response than the original. They are loaded recursively from the `path` directory at startup.   
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
If a custom `tapeNameGenerator` is provided, it will be called to produce an alternate file path under `path` that can be based on the tape contents. Note that the file extension `.json5` will be appended automatically.

##### Example:
```javascript
function nameGenerator(tapeNumber, tape) {
  // organize in folders by request method
  // e.g. tapes/GET/unnamed-1.json5
  //      tapes/GET/unnamed-3.json5
  //      tapes/POST/unnamed-2.json5
  return path.join(`${tape.req.method}`, `unnamed-${tapeNumber}`)
}
```

#### Request and Response body
If the content type of the request or response is considered _human readable_ and _uncompressed_, the body will be saved in plain text.      
Otherwise, the body will be saved as a Base64 string, allowing to save binary content.

##### Pretty Printing
If the request or response have a JSON *content-type*, their body will be pretty printed as an object in the tape for easier readability.   
This means differences in formatting are ignored when comparing tapes, and any special formatting in the response will be lost. 
 
## Recording Modes
Talkback proxying and recording behavior can be controlled through the `record` and `fallbackMode` options.   

There are 3 possible recording modes:   

|Value| Description|
|-----|------------|
|`NEW`| If no tape matches the request, proxy it and save the response to a tape|
|`OVERWRITE`| Always proxy the request and save the response to a tape, overwriting any existing one|
|`DISABLED`| If a matching tape exists, return it. Otherwise, don't proxy the request and use `fallbackMode` for the response|
            
The `fallbackMode` option lets you choose what to do when recording is `DISABLED` and an unknown request arrives.  

There are 2 possible fallback modes:   

|Value| Description|
|-----|------------|
|`NOT_FOUND`| Log an error and return a 404 response|
|`PROXY`| Proxy the request to `host` and return its response, but don't create a tape|

**It is recommended to `DISABLE` recording when using talkback for test running. This way, there are no side-effects and broken tests fail faster.**

Both options accept either one of the possible modes to be used for all requests or a function that takes the request as a parameter and returns a valid mode.

```javascript
const talkback = require("talkback")

const opts = {
  record: talkback.Options.RecordMode.DISABLED,
  fallbackMode: (req) => {
    if (req.url.includes("/mytest")) {
        return talkback.Options.FallbackMode.PROXY
      }
      return talkback.Options.FallbackMode.NOT_FOUND
  } 
}

```

## Custom request body matcher
By default, in order for a request to match against a saved tape, both request and tape need to have the exact same body.      
There might be cases were this rule is too strict (for example, if your body contains time dependent bits) but enabling `ignoreBody` is too lax.

Talkback lets you pass a custom matching function as the `bodyMatcher` option.   
The function will receive a saved tape and the current request, and it has to return whether they should be considered a match on their body.   
Body matching is the last step when matching a tape. In order for this function to be called, everything else about the request should match the tape too (url, method, headers).   
The `bodyMatcher` is not called if tape and request bodies are already the same. 

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

In this case we are adding our own `tag` property to the saved tape `meta` object. This way, we are only using the custom matching logic on some specific requests, and can even have different logic for different categories of requests.   
Note that both the tape's and the request's bodies are `Buffer` objects.

## Custom request URL matcher
Similar to the [`bodyMatcher`](#custom-request-body-matcher), there's the `urlMatcher` option, which will let you customize how a request and a tape are matched on their URL.

### Example:

```javascript
function urlMatcher(tape, req) {
    if (tape.meta.tag === "user-info") {
      // Match if URL is of type /users/{username}
      return !!req.url.match(/\/users\/[a-zA-Z-0-9]+/);
    }
    return false;
}
```
  
## Custom response decorator
If you want to add a little bit of dynamism to the response coming from a matching existing tape or adjust the response that the proxied server returns, you can do so by using the `responseDecorator` option.      
This can be useful for example if your response needs to contain an ID that gets sent on the request, or if your response has a time dependent field.     

The function will receive a copy of the matching tape and the in-flight request object, and it has to return the modified tape. Note that since you're receiving a copy of the matching tape, modifications that you do to it won't persist between different requests.   
Talkback will also update the `Content-Length` header if it was present in the original response.   

### Example:
We're going to hit an `/auth` endpoint, and update just the `expiration` field of the JSON response that was saved in the tape to be a day from now.      

```javascript
function responseDecorator(tape, req) {
  if (tape.meta.tag === "auth") {
    const tapeBody = JSON.parse(tape.res.body.toString())
    const expiration = new Date()
    expiration.setDate(expiration.getDate() + 1)
    const expirationEpoch = Math.floor(expiration.getTime() / 1000)
    tapeBody.expiration = expirationEpoch

    const newBody = JSON.stringify(tapeBody)
    tape.res.body = Buffer.from(newBody)
  }
  return tape
}
```

In this example we are also adding our own `tag` property to the saved tape `meta` object. This way, we are only using the custom logic on some specific requests, and can even have different logic for different categories of requests.   
Note that both the tape's and the request's bodies are `Buffer` objects and they should be kept as such.    

## Exit summary
If you are using Talkback for your test suite, you will probably have tons of different tapes after some time. It can be difficult to know if all of them are still required.   
To help, when talkback exits, it will print a list of all the tapes that have NOT been used and a list of all the new tapes. If your test suite is green, you can safely delete anything that hasn't been used.
```
===== SUMMARY (My Server) =====
New tapes:
- unnamed-4.json5
Unused tapes:
- not-valid-request.json5
- user-profile.json5
```
This can be disabled with the `summary` option.

# Licence
MIT
