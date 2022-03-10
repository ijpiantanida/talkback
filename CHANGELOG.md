# Changelog

## v3.0.0
- Drop support for node 10. Minimum required version 12.0
- Dependencies updates

## v2.5.0
- Structured log format

## v2.4.3
- Add `allowHeaders` option
- Dependencies updates

## v2.4.2
- Add `application/x-amz-json-1.0` and `application/x-amz-json-1.1` as json media types (thanks **[@brandonc](https://github.com/brandonc)**)

## v2.4.1
- Fix handling of responses with JSON content-type, but malformed body (thanks **[@SebFlippence](https://github.com/SebFlippence)**)
- Dependencies updates

## v2.4.0
- Add [`tapeDecorator` option](/README.md#custom-tape-decorator)
- Add [`MatchingContext` object](/README.md#matching-context) as decorators parameter
- Dependencies updates

## v2.3.0
- Fix for node 15 (thanks **[@halilb](https://github.com/halilb)**)
- Dependencies updates

## v2.2.2
- Dependencies updates

## v2.2.1
- Dependencies updates

## v2.2.0
- Expose requestHandler as first-class citizen
- Add requestHandler example

## v2.1.0
- Add support for JSON Schema media-types
- Rewrite talkback to Typescript
- Now you can also `import talkback from "talkback/es6"`

## v2.0.0
- Drop node 8 support. Min. required version is node 10
- Order of properties is ignored when matching JSON tapes body

## v1.12.0
- Store compressed (gzip, deflate) human-readable bodies as plain text 

## v1.11.1
- Dependencies updates

## v1.11.0
- Add `latency` option
- Add `errorRate` option
- Add `requestDecorator` option
- Expose default options as `talkback.Options.Default`

## v1.10.0
- Load tapes from deep directories
- Add `tapeNameGenerator` option (thanks **[@tartale](https://github.com/tartale)**)
- Introduce record modes through `record` option. 
- Allow `record` option to take a function to change recording mode based on the request
- Allow `fallbackMode` option to take a function to change fallback mode based on the request

- Bugfix: wrong Content-Length when tapes contain multi-bytes characters (thanks **[@sebflipper](https://github.com/sebflipper)**)
- **DEPRECATION**: `record` option will no longer take boolean values
- **DEPRECATION**: `fallbackMode` options `404` and `proxy` have been replaced by `NOT_FOUND` and `PROXY` respectively

## v1.9.0
- `responseDecorator` is now called for both matched tapes and the initial response returned by the proxied server

## v1.8.1
- Fix bug with HEAD requests

## v1.8.0
- Pretty print JSON requests & responses in saved tapes
- Always ignore `content-length` header for tape matching 
- Add `name` option
- Print `name` in Summary title

## v1.7.0
- Add `https` server option.
- Add `urlMatcher` option to customize how the request URL is matched against saved tapes.

## v1.6.0
- Add `responseDecorator` option to add dynamism to saved tapes responses.
- Add `hasTapeBeenUsed` and `resetTapeUsage` methods to the server interface (thanks **[@sjaakieb](https://github.com/sjaakieb)**)

## v1.5.0
- Add `bodyMatcher` option to customize how the request body is matched against saved tapes.

## v1.4.0
- Add `ignoreBody` option (thanks **[@meop](https://github.com/meop)**)
- Add `fallbackMode` option to allow to proxy unknown requests if no tape exists. Defaults to 404 error (thanks **[@meop](https://github.com/meop)**)

## v1.3.0
- Add `ignoreQueryParams` option
- Updated dependencies

## v1.2.0
- Add `debug` option to print verbose information about tapes matching. Defaults to `false`
- Fix bug that mixed `req` and `res` humanReadable property (thanks **[@roypa](https://github.com/roypa)**) 

## v1.1.4
- Add `silent` option to mute information console output on requests
