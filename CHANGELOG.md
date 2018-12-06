# Changelog

## v1.8.0
- Pretty print JSON requests & responses in saved tapes
- Always ignore `content-length` header for tape matching 

## v1.7.0
- Add `https` server option.
- Add `urlMatcher` option to customize how the request URL is matched against saved tapes.

## v1.6.0
- Add `responseDecorator` option to add dynamism to saved tapes responses.
- Add `hasTapeBeenUsed` and `resetTapeUsage` methods to the server interface. (thanks **[@sjaakieb](https://github.com/sjaakieb)**)

## v1.5.0
- Add `bodyMatcher` option to customize how the request body is matched against saved tapes.

## v1.4.0
- Add `ignoreBody` option (thanks **[@meop](https://github.com/meop)**)
- Add `fallbackMode` option to allow to proxy unknown requests if no tape exists. Defaults to 404 error. (thanks **[@meop](https://github.com/meop)**)

## v1.3.0
- Add `ignoreQueryParams` option
- Updated dependencies

## v1.2.0
- Add `debug` option to print verbose information about tapes matching. Defaults to `false`
- [Thanks @roypa] Fix bug that mixed `req` and `res` humanReadble property

## v1.1.4
- Add `silent` option to mute information console output on requests
