<img src="docs/logo.png" width="300" alt="Talkback logo">

# Talkback

Talkback is a javascript HTTP proxy that records and playbacks HTTP requests. As long as you have node.js in your environment, you can run talkback to record requests from applications written in any language/framework.   
You can use it to accelerate your integration tests or run your application against a mocked server.       

[![npm version](https://badge.fury.io/js/talkback.svg)](https://badge.fury.io/js/talkback)
[![Build Status](https://github.com/ijpiantanida/talkback/actions/workflows/ci_build.yml/badge.svg?branch=main)](https://github.com/ijpiantanida/talkback/actions/workflows/ci_build.yml)

## Installation

```
npm install talkback
```

## Usage

Talkback is pretty easy to set up.   
Define which host it will be proxying, which port it should listen to and where to find and save tapes.   

When a request arrives to talkback, it will try to match it against a previously saved tape and quickly return the tape's response.   
If no tape matches the request, it will forward it to the origin host, save the tape to disk for future uses and return the response.   

```javascript
const talkback = require("talkback");
//import talkback from "talkback/es6";

const opts = {
  host: "https://api.myapp.com/foo",
  record: talkback.Options.RecordMode.NEW,
  port: 5544,
  path: "./my-tapes"
};
const server = talkback(opts);
server.start(() => console.log("Talkback Started"));
```

Talkback can be used in 2 ways:
  - as a standalone HTTP server in its own separate process. [Example](/examples/server).
  - as a library, where you are in charge of routing requests to talkback. [Example](/examples/request-handler).

#### talkback(options: Partial\<Options\>): TalkbackServer
Returns an unstarted instance of a talkback server.   
See all [Options](#options).

```javascript
const talkback = talkback(options)

talkback.start(() => console.log("Talkback Started"))
talkback.close()
```

#### talkback.requestHandler(options: Partial\<Options\>): Promise\<RequestHandler\>
Returns a RequestHandler instance ready to receive requests.   
See all [Options](#options).   

The handler takes a [request](#request) and returns a [response](#response) Promise.

```javascript
const talkbackHandler = await talkback.requestHandler(options)

const response = await talkbackHandler.handle(httpRequest)
```

### Options

| Name | Type | Description | Default |   
|------|------|-------------|---------|
| **host** | `String` | Where to proxy unknown requests| |
| **port** | `String` | Talkback port | 8080 |
| **path** | `String` | Path where to load and save tapes | `./tapes/` |
| **https** | `Object` | HTTPS server [options](#https-options) | [Defaults](#https-options) |
| **record** | `String \| Function` | Set record mode. [More info](#recording-modes) | `RecordMode.NEW` |
| **fallbackMode** | `String \| Function` | Fallback mode for unknown requests when recording is disabled. [More info](#recording-modes) | `FallbackMode.NOT_FOUND` |
| **name** | `String` | Server name | Defaults to `host` value |
| **tapeNameGenerator** | `Function` | [Customize](#file-name) how a tape name is generated for new tapes. | `null` |
| **allowHeaders** | `[String]` | List of headers to include when matching tapes. If present, headers that are not part of the list will be ignored. By default, most headers are considered (See `ignoreHeaders`)</br></br>Setting this value to `[]` will disable header matching on tapes. | `null` |
| **ignoreHeaders** | `[String]` | List of headers to ignore when matching tapes. By default, most headers are considered | `['content-length', 'host]` |
| **ignoreQueryParams** | `[String]` | List of query params to ignore when matching tapes. Useful when having dynamic query params like timestamps| `[]` |
| **ignoreBody** | `Boolean` | Should the request body be ignored when matching tapes | `false` |
| **bodyMatcher** | `Function` | Customize how a request's body is matched against saved tapes. [More info](#custom-request-body-matcher) | `null` |
| **urlMatcher** | `Function` | Customize how a request's URL is matched against saved tapes. [More info](#custom-request-url-matcher) | `null` |
| **requestDecorator** | `Function` | Modify requests before they are proxied. [More info](#custom-request-decorator) | `null` |  
| **responseDecorator** | `Function` | Modify responses before they are returned. [More info](#custom-response-decorator) | `null` |  
| **tapeDecorator** | `Function` | Modify tapes before they are stored. [More info](#custom-tape-decorator) | `null` |
| **latency** | `Number \| \[Number\] \| Function` | Synthetic latency for requests (in ms). [More info](#latency) | `0` |
| **errorRate** | `Number \| Function` | Probability between 0 and 100 of injecting a synthetic error. [More info](#error-rate) | `0` |
| **silent** | `Boolean` | Disable requests information console messages in the middle of requests | `false` |
| **summary** | `Boolean` | Enable exit summary of new and unused tapes at exit. [More info](#exit-summary) | `true` |
| **debug** | `Boolean` | Enable verbose debug information | `false` |

### HTTPS options
| Name | Type | Description | Default |
|------|------|-------------|---------|
| **enabled** | `Boolean` | Enables HTTPS server | `false` |
| **keyPath** | `String` | Path to the key file | `null` | 
| **certPath** | `String` | Path to the cert file | `null` | 

## Tapes
Tapes are where talkback stores requests and their response.   
* They can be freely edited to match new requests or return a different response than the original. They are loaded recursively from the `path` directory at startup. Since they are only loaded on startup, any changes to a tape requires a server restart to be applied.   
* Talkback will do a best effort to store the tape request and response body in plain text (human readable) [More info](#request-and-response-body).    
* Tapes use the [JSON5](http://json5.org/) format. JSON5 is an extensions to the JSON format that allows for very neat features like comments, trailing commas and keys without quotes.      

#### Format
All tapes have the following 3 properties:   
* **meta**: [Metadata](#metadata) object. Stores additional metadata about the tape.
* **req**: [Request](#request) object. Used to match incoming requests against the tape.
* **res**: [Response](#response) object. The HTTP response that will be returned in case the tape matches a request.

#### Metadata
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| **createdAt** | `Date` | Creation datetime of the tape | `2018-12-07T02:49:53.859Z` |
| **host** | `String` | Base host url used for this request. Informative, it plays no role during the matching process | `https://api.github.com` |
| **tag** | `String` | Custom tag to identify the tape | `auth` |
| **errorRate** | `Number` | Number between 0 and 100 that marks the probability of the request producing a synthetic failure. [More info](#error-rate) | `10` |
| **latency** | `Number \| [Number]` | Synthetic latency for requests (in ms). [More info](#latency) | `10` |
| **reqUncompressed** | `Boolean` | Whether the request body has been uncompressed | `false` |
| **resUncompressed** | `Boolean` | Whether the response body has been uncompressed | `false` | 
| **reqHumanReadable** | `Boolean` | Whether the request body is in a human-readable format or base64 encoded | `true` | 
| **resHumanReadable** | `Boolean` | Whether the response body is in a human-readable format or base64 encoded | `true` |
   
In addition to talkback properties, you can define their own custom fields either by manually editing the tape file or by dynamically adding them using a [custom tape decorator](#custom-tape-decorator).   

#### Request
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| **url** | `String` | Url relative to the host. | `/users` |
| **method** | `String` | HTTP method | `GET` |
| **headers** | `Object\<String, String\>` | Request headers | `{"content-type": "application/json", accept: "*/*"}` |
| **body** | `Buffer` | Request body | `Buffer.from("FOOBAR")` |

#### Response
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| **status** | `Number` | HTTP response status code | `200` |
| **headers** | `Object\<String, [String]\>` | Response headers | `{"content-type": ["application/json"]}` |
| **body** | `Buffer` | Response body | `Buffer.from("FOOBAR")` |

#### Request and Response body
Talkback will store the request and response body in plan text and uncompressed (human readable) if the content-encoding is supported (gzip, deflate, br) and the content-type is considered human readable ([see list](src/utils/media-type.ts#L15)). For this to work, the content-type header should be present in the request/response.  

##### Pretty Printing
If the request or response have a JSON *content-type*, their body will be pretty printed as an object in the tape for easier readability.   
This means differences in formatting are ignored when comparing tapes, and any special formatting in the response will be lost.

#### File Name
New tapes will be created under the `path` directory with the name `unnamed-n.json5`, where `n` is the tape number.   
Tapes can be renamed at will, for example to give some meaning to the scenario the tape represents.  
If a custom `tapeNameGenerator` is provided, it will be called to produce an alternate file path under `path` that can be based on the tape contents. Note that the file extension `.json5` will be appended automatically.

##### Example:
```javascript
function nameGenerator(tapeNumber: number, tape: Tape) {
  // organize in folders by request method
  // e.g. tapes/GET/unnamed-1.json5
  //      tapes/GET/unnamed-3.json5
  //      tapes/POST/unnamed-2.json5
  return path.join(`${tape.req.method}`, `unnamed-${tapeNumber}`)
}
``` 
 
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

**It is recommended to `DISABLE` recording when using talkback for test running. This way, there are no side effects and broken tests fail faster.**

Both options accept either one of the possible modes to be used for all requests or a function that takes the request as a parameter and returns a valid mode.

```javascript
const talkback = require("talkback")

const opts = {
  record: talkback.Options.RecordMode.DISABLED,
  fallbackMode: (req: Req) => {
    if (req.url.includes("/mytest")) {
        return talkback.Options.FallbackMode.PROXY
      }
      return talkback.Options.FallbackMode.NOT_FOUND
  } 
}

```

## Custom request body matcher
By default, in order for a request to match against a saved tape, both request and tape need to have the exact same body.      
There might be cases where this rule is too strict (for example, if your body contains time dependent bits) but enabling `ignoreBody` is too lax.

Talkback lets you pass a custom matching function as the `bodyMatcher` option.   
The function will receive a saved tape and the current request, and it has to return whether they should be considered a match on their body.   
Body matching is the last step when matching a tape. In order for this function to be called, everything else about the request should match the tape too (url, method, headers).   
The `bodyMatcher` is not called if tape and request bodies are already the same. 

### Example:

```javascript
function bodyMatcher(tape: Tape, req: Req) {
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
Similar to the [`bodyMatcher`](#custom-request-body-matcher) option, there's the `urlMatcher` option, which will let you customize how a request and a tape are matched on their URL.

### Example:

```javascript
function urlMatcher(tape: Tape, req: Req) {
    if (tape.meta.tag === "user-info") {
      // Match if URL is of type /users/{username}
      return !!req.url.match(/\/users\/[a-zA-Z-0-9]+/);
    }
    return false;
}
```

## Custom decorators
Talback lets you tap into the request lifecycle through the decorator options:
1. [Request Decorator](#custom-request-decorator)
2. [Response Decorator](#custom-response-decorator)
3. [Tape Decorator](#custom-tape-decorator)

#### Matching Context
When the request starts, talkback will create a `MatchingContext` object, which will be passed to all your decorators as an additional parameter.   
It's the main way in which you can connect all your different decorator functions without having to modify the actual request/response.   

The context will contain some useful properties, but you can also extend it with your own.

|Property | Type | Description | Example | 
|---------|------|-------------|---------|
| **id** | `String` | Unique id (UUID v4) | `52a3cdf9-e3be-439f-b81d-4301b4f5adf0` |

## Custom request decorator
By default, talkback will just proxy requests to the host as they are.   
If you want to customize requests before they're proxied (or looked up in stored tapes) you can do so through the `requestDecorator` option.   

`requestDecorator` takes a function that will receive the original request and the context object as parameters, and should return the modified request.

```javascript
function requestDecorator(req: Req, context: MatchingContext) {
  requestStartTime[context.id] = new Date().getTime()

  delete req.headers['accept-encoding'];
  return req;
}
```
In this example we are using the context's id to store the request's start time to later be used by another decorator. 

  
## Custom response decorator
If you want to add dynamism to the response coming from a matching existing tape or adjust the response that the proxied server returns, you can do so by using the `responseDecorator` option.      
This can be useful for example if your response needs to contain an ID that gets sent on the request, or if your response has a time dependent field.     

The function will receive a copy of the matching tape, the in-flight request object and the context object as parameters, and it should return the modified tape. Note that since you're receiving a copy of the matching tape, changes to the object won't persist between different requests.   
Talkback will also update the `Content-Length` header if it was present in the original response.   

### Example:
We're going to hit an `/auth` endpoint, and update just the `expiration` field of the JSON response that was saved in the tape to be a day from now.      

```javascript
function responseDecorator(tape: Tape, req: Req, context: MatchingContext) {
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

In this example we are making use of the `meta.tag` property on the saved tape to decide whether we apply the custom logic or not.      
*Note that both the tape's and the request's bodies are `Buffer` objects, and they should be kept as such.*    

## Custom tape decorator
Before saving the tape to disk talback can call your own `tapeDecorator` function where you can edit any of the tape's properties.
The function will receive the original tape and the context object as parameters, and it should return the tape to be stored.   

You can use this to edit any of talkback's properties or add your own `meta` fields.

```javascript
function tapeDecorator(tape: Tape, context: MatchingContext) {
  if (tape.req.url.includes("/auth/")) {
    tape.meta.tag = "auth"
  }

  const originalDurationMs = new Date().getTime() - requestStartTime[context.id]
  tape.meta.originalDurationMs = originalDurationMs 
  tape.meta.latency = [Math.floor(0.5*originalDurationMs), Math.floor(1.5*originalDurationMs)]
  
  return tape
}
```
In this example we are dynamically adding a tag based on the request URL.  
We are also using the context's id to retrieve the initial request time which was saved by a custom [`requestDecorator`](#custom-request-decorator) and calculating how long did the request take. We store the original duration as a custom meta property, and we also set a range for the [`latency` feature](#latency).  

## Latency
By default, talkback will try to reply to requests as fast as it can, but sometimes it's useful to understand how applications behave under real-world or even undesirably high response times.   
Talkback lets you control response times both at a _global_ or at a _tape level_.   

The `latency` option will apply for all requests that match an existing tape or when using the [`PROXY` fallback mode](#recording-modes).   

There are 3 possible types of values:
 - A number: Fixed number of milliseconds for all response times.
 - An array in the form `[min, max]`: Requests will take a random number of milliseconds in the given range.
 - A function `(req) => latency`: The function will be called for each request and it should return the desired number of milliseconds for the response time.

At the same time, tapes can define their own specific response times by adding a `latency` property to the [`meta` object](#tapes).   
This property accepts both numbers and ranges and will take precedence over the global `latency` option.

```json
{
  "meta": {
    "createdAt": "2017-09-10T23:19:27.010Z",
    "host": "http://localhost:8898",
    "resHumanReadable": true,
    "latency": [100, 500]
  },
  ...
}
```

## Error rate
Similar to what the [latency](#latency) option does, you might want to test how your application behaves when downstream services start failing.   
Talkback can aid here through the `errorRate` option, by returning synthetic 503 errors back to you application.
 
The `errorRate` option will apply for all requests that match an existing tape or when using the [`PROXY` fallback mode](#recording-modes).   

There are 2 possible types of values:
 - A number between 0 and 100 that defines the probability of returning an error for each request.
 - A function `(req) => errorRate`: The function will be called for each request and it should return the desired probability of error for that specific request.

At the same time, tapes can define their own specific error rates by adding an `errorRate` property to the [`meta` object](#tapes).   

```json
{
  "meta": {
    "createdAt": "2017-09-10T23:19:27.010Z",
    "host": "http://localhost:8898",
    "resHumanReadable": true,
    "errorRate": 50
  },
  ...
}
```

## Exit summary
If you are using talkback for your test suite, you will probably have tons of different tapes after some time. It can be difficult to know if all of them are still required.   
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
