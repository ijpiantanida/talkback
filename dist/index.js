'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('@babel/runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('@babel/runtime/helpers/asyncToGenerator'));
var _objectSpread = _interopDefault(require('@babel/runtime/helpers/objectSpread'));
var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('@babel/runtime/helpers/createClass'));

var contentTypeParser = require("content-type");

var humanReadableContentTypes = ["application/javascript", "application/json", "text/css", "text/html", "text/javascript", "text/plain"];

var MediaType =
/*#__PURE__*/
function () {
  function MediaType(htmlReqRes) {
    _classCallCheck(this, MediaType);

    this.htmlReqRes = htmlReqRes;
  }

  _createClass(MediaType, [{
    key: "isHumanReadable",
    value: function isHumanReadable() {
      var headers = this.htmlReqRes.headers;
      var contentEncoding = this.getHeader(headers, "content-encoding");
      var contentType = this.getHeader(headers, "content-type");
      var notCompressed = !contentEncoding || contentEncoding === "identity";

      if (!contentType) {
        return false;
      }

      contentType = contentTypeParser.parse(contentType);
      return notCompressed && humanReadableContentTypes.indexOf(contentType.type) >= 0;
    }
  }, {
    key: "getHeader",
    value: function getHeader(headers, headerName) {
      var value = headers[headerName];

      if (Array.isArray(value)) {
        return value[0];
      } else {
        return value;
      }
    }
  }]);

  return MediaType;
}();

var URL = require("url");

var querystring = require("querystring");

var bufferShim = require("buffer-shims");

var Tape =
/*#__PURE__*/
function () {
  function Tape(req, options) {
    _classCallCheck(this, Tape);

    this.req = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body
    };
    this.options = options;
    this.headersToIgnore = ["host"].concat(this.options.ignoreHeaders);
    this.cleanupHeaders();
    this.queryParamsToIgnore = this.options.ignoreQueryParams;
    this.cleanupQueryParams();
    this.meta = {
      createdAt: new Date(),
      host: this.options.host
    };
  }

  _createClass(Tape, [{
    key: "cleanupHeaders",
    value: function cleanupHeaders() {
      var newHeaders = _objectSpread({}, this.req.headers);

      this.headersToIgnore.forEach(function (h) {
        return delete newHeaders[h];
      });
      this.req = _objectSpread({}, this.req, {
        headers: newHeaders
      });
    }
  }, {
    key: "cleanupQueryParams",
    value: function cleanupQueryParams() {
      if (this.queryParamsToIgnore.length === 0) {
        return;
      }

      var url = URL.parse(this.req.url, {
        parseQueryString: true
      });

      if (!url.search) {
        return;
      }

      var query = _objectSpread({}, url.query);

      this.queryParamsToIgnore.forEach(function (q) {
        return delete query[q];
      });
      var newQuery = querystring.stringify(query);

      if (newQuery) {
        url.query = query;
        url.search = "?" + newQuery;
      } else {
        url.query = null;
        url.search = null;
      }

      this.req.url = URL.format(url);
    }
  }, {
    key: "toRaw",
    value: function toRaw() {
      var reqBody = this.bodyFor(this.req, "reqHumanReadable");
      var resBody = this.bodyFor(this.res, "resHumanReadable");
      return {
        meta: this.meta,
        req: _objectSpread({}, this.req, {
          body: reqBody
        }),
        res: _objectSpread({}, this.res, {
          body: resBody
        })
      };
    }
  }, {
    key: "bodyFor",
    value: function bodyFor(reqResObj, metaProp) {
      var mediaType = new MediaType(reqResObj);

      if (mediaType.isHumanReadable()) {
        this.meta[metaProp] = true;
        return reqResObj.body.toString("utf8");
      } else {
        return reqResObj.body.toString("base64");
      }
    }
  }, {
    key: "clone",
    value: function clone() {
      var raw = this.toRaw();
      return Tape.fromStore(raw, this.options);
    }
  }], [{
    key: "fromStore",
    value: function fromStore(raw, options) {
      var req = _objectSpread({}, raw.req);

      if (raw.meta.reqHumanReadable) {
        req.body = bufferShim.from(raw.req.body);
      } else {
        req.body = bufferShim.from(raw.req.body, "base64");
      }

      var tape = new Tape(req, options);
      tape.meta = raw.meta;
      tape.res = _objectSpread({}, raw.res);

      if (tape.meta.resHumanReadable) {
        tape.res.body = bufferShim.from(tape.res.body);
      } else {
        tape.res.body = bufferShim.from(raw.res.body, "base64");
      }

      return tape;
    }
  }]);

  return Tape;
}();

var fetch = require("node-fetch");

var RequestHandler =
/*#__PURE__*/
function () {
  function RequestHandler(tapeStore, options) {
    _classCallCheck(this, RequestHandler);

    this.tapeStore = tapeStore;
    this.options = options;
  }

  _createClass(RequestHandler, [{
    key: "handle",
    value: function () {
      var _handle = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(req) {
        var reqTape, resTape, resObj;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                reqTape = new Tape(req, this.options);
                resTape = this.tapeStore.find(reqTape);

                if (!resTape) {
                  _context.next = 7;
                  break;
                }

                if (this.options.responseDecorator) {
                  resTape = this.options.responseDecorator(resTape.clone(), req);

                  if (resTape.res.headers["content-length"]) {
                    resTape.res.headers["content-length"] = resTape.res.body.length;
                  }
                }

                resObj = resTape.res;
                _context.next = 18;
                break;

              case 7:
                if (!this.options.record) {
                  _context.next = 15;
                  break;
                }

                _context.next = 10;
                return this.makeRealRequest(req);

              case 10:
                resObj = _context.sent;
                reqTape.res = _objectSpread({}, resObj);
                this.tapeStore.save(reqTape);
                _context.next = 18;
                break;

              case 15:
                _context.next = 17;
                return this.onNoRecord(req);

              case 17:
                resObj = _context.sent;

              case 18:
                return _context.abrupt("return", resObj);

              case 19:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function handle(_x) {
        return _handle.apply(this, arguments);
      };
    }()
  }, {
    key: "onNoRecord",
    value: function () {
      var _onNoRecord = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2(req) {
        var fallbackMode;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                fallbackMode = this.options.fallbackMode;
                this.options.logger.log("Tape for ".concat(req.url, " not found and recording is disabled (fallbackMode: ").concat(fallbackMode, ")"));
                this.options.logger.log({
                  url: req.url,
                  headers: req.headers
                });

                if (!(fallbackMode === "proxy")) {
                  _context2.next = 7;
                  break;
                }

                _context2.next = 6;
                return this.makeRealRequest(req);

              case 6:
                return _context2.abrupt("return", _context2.sent);

              case 7:
                return _context2.abrupt("return", {
                  status: 404,
                  body: "talkback - tape not found"
                });

              case 8:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function onNoRecord(_x2) {
        return _onNoRecord.apply(this, arguments);
      };
    }()
  }, {
    key: "makeRealRequest",
    value: function () {
      var _makeRealRequest = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee3(req) {
        var method, url, body, headers, host, fRes, buff;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                method = req.method, url = req.url, body = req.body;
                headers = _objectSpread({}, req.headers);
                delete headers.host;
                host = this.options.host;
                this.options.logger.log("Making real request to ".concat(host).concat(url));

                if (method === "GET" || method === "HEAD") {
                  body = null;
                }

                _context3.next = 8;
                return fetch(host + url, {
                  method: method,
                  headers: headers,
                  body: body,
                  compress: false
                });

              case 8:
                fRes = _context3.sent;
                _context3.next = 11;
                return fRes.buffer();

              case 11:
                buff = _context3.sent;
                return _context3.abrupt("return", {
                  status: fRes.status,
                  headers: fRes.headers.raw(),
                  body: buff
                });

              case 13:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function makeRealRequest(_x3) {
        return _makeRealRequest.apply(this, arguments);
      };
    }()
  }]);

  return RequestHandler;
}();

var Sumary =
/*#__PURE__*/
function () {
  function Sumary(tapes) {
    _classCallCheck(this, Sumary);

    this.tapes = tapes;
  }

  _createClass(Sumary, [{
    key: "print",
    value: function print() {
      console.log("===== SUMMARY =====");
      var newTapes = this.tapes.filter(function (t) {
        return t.new;
      });

      if (newTapes.length > 0) {
        console.log("New tapes:");
        newTapes.forEach(function (t) {
          return console.log("- ".concat(t.path));
        });
      }

      var unusedTapes = this.tapes.filter(function (t) {
        return !t.used;
      });

      if (unusedTapes.length > 0) {
        console.log("Unused tapes:");
        unusedTapes.forEach(function (t) {
          return console.log("- ".concat(t.path));
        });
      }
    }
  }]);

  return Sumary;
}();

var TapeMatcher =
/*#__PURE__*/
function () {
  function TapeMatcher(tape, options) {
    _classCallCheck(this, TapeMatcher);

    this.tape = tape;
    this.options = options;
  }

  _createClass(TapeMatcher, [{
    key: "sameAs",
    value: function sameAs(otherTape) {
      var otherReq = otherTape.req;
      var req = this.tape.req;
      var sameURL = req.url === otherReq.url;

      if (!sameURL) {
        this.options.logger.debug("Not same URL ".concat(req.url, " vs ").concat(otherReq.url));
        return false;
      }

      var sameMethod = req.method === otherReq.method;

      if (!sameMethod) {
        this.options.logger.debug("Not same METHOD ".concat(req.method, " vs ").concat(otherReq.method));
        return false;
      }

      var currentHeadersLength = Object.keys(req.headers).length;
      var otherHeadersLength = Object.keys(otherReq.headers).length;
      var sameNumberOfHeaders = currentHeadersLength === otherHeadersLength;

      if (!sameNumberOfHeaders) {
        this.options.logger.debug("Not same #HEADERS ".concat(JSON.stringify(req.headers), " vs ").concat(JSON.stringify(otherReq.headers)));
        return false;
      }

      var headersSame = true;
      Object.keys(req.headers).forEach(function (k) {
        var entryHeader = req.headers[k];
        var header = otherReq.headers[k];
        headersSame = headersSame && entryHeader === header;
      });

      if (!headersSame) {
        this.options.logger.debug("Not same HEADERS values ".concat(JSON.stringify(req.headers), " vs ").concat(JSON.stringify(otherReq.headers)));
        return false;
      }

      if (!this.options.ignoreBody) {
        var sameBody = req.body.equals(otherReq.body);

        if (!sameBody) {
          if (!this.options.bodyMatcher) {
            this.options.logger.debug("Not same BODY ".concat(req.body, " vs ").concat(otherReq.body));
            return false;
          }

          var bodyMatches = this.options.bodyMatcher(this.tape, otherReq);

          if (!bodyMatches) {
            this.options.logger.debug("Not same bodyMatcher ".concat(req.body, " vs ").concat(otherReq.body));
            return false;
          }
        }
      }

      return true;
    }
  }]);

  return TapeMatcher;
}();

var fs = require("fs");

var path = require("path");

var JSON5 = require("json5");

var mkdirp = require("mkdirp");

var TapeStore =
/*#__PURE__*/
function () {
  function TapeStore(options) {
    _classCallCheck(this, TapeStore);

    this.path = path.normalize(options.path + "/");
    this.options = options;
    this.tapes = [];
  }

  _createClass(TapeStore, [{
    key: "load",
    value: function load() {
      mkdirp.sync(this.path);
      var items = fs.readdirSync(this.path);

      for (var i = 0; i < items.length; i++) {
        var filename = items[i];
        var fullPath = "".concat(this.path).concat(filename);
        var stat = fs.statSync(fullPath);

        if (!stat.isDirectory()) {
          try {
            var data = fs.readFileSync(fullPath, "utf8");
            var raw = JSON5.parse(data);
            var tape = Tape.fromStore(raw, this.options);
            tape.path = filename;
            this.tapes.push(tape);
          } catch (e) {
            console.log("Error reading tape ".concat(fullPath), e.message);
          }
        }
      }

      console.log("Loaded ".concat(this.tapes.length, " tapes"));
    }
  }, {
    key: "find",
    value: function find(newTape) {
      var _this = this;

      var foundTape = this.tapes.find(function (t) {
        _this.options.logger.debug("Comparing against tape ".concat(t.path));

        return new TapeMatcher(t, _this.options).sameAs(newTape);
      });

      if (foundTape) {
        foundTape.used = true;
        this.options.logger.log("Serving cached request for ".concat(newTape.req.url, " from tape ").concat(foundTape.path));
        return foundTape;
      }
    }
  }, {
    key: "save",
    value: function save(tape) {
      tape.new = true;
      tape.used = true;
      this.tapes.push(tape);
      var toSave = tape.toRaw();
      var tapeName = "unnamed-".concat(this.tapes.length, ".json5");
      tape.path = tapeName;
      var filename = this.path + tapeName;
      this.options.logger.log("Saving request ".concat(tape.req.url, " at ").concat(filename));
      fs.writeFileSync(filename, JSON5.stringify(toSave, null, 4));
    }
  }, {
    key: "hasTapeBeenUsed",
    value: function hasTapeBeenUsed(tapeName) {
      return this.tapes.some(function (t) {
        return t.used && t.path === tapeName;
      });
    }
  }, {
    key: "resetTapeUsage",
    value: function resetTapeUsage() {
      return this.tapes.forEach(function (t) {
        return t.used = false;
      });
    }
  }]);

  return TapeStore;
}();

var http = require("http");

var TalkbackServer =
/*#__PURE__*/
function () {
  function TalkbackServer(options) {
    _classCallCheck(this, TalkbackServer);

    this.options = options;
    this.tapeStore = new TapeStore(this.options);
  }

  _createClass(TalkbackServer, [{
    key: "handleRequest",
    value: function handleRequest(req, res) {
      var _this = this;

      var reqBody = [];
      req.on("data", function (chunk) {
        reqBody.push(chunk);
      }).on("end",
      /*#__PURE__*/
      _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee() {
        var requestHandler, fRes;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                reqBody = Buffer.concat(reqBody);
                req.body = reqBody;
                requestHandler = new RequestHandler(_this.tapeStore, _this.options);
                _context.next = 6;
                return requestHandler.handle(req);

              case 6:
                fRes = _context.sent;
                res.writeHead(fRes.status, fRes.headers);
                res.end(fRes.body);
                _context.next = 16;
                break;

              case 11:
                _context.prev = 11;
                _context.t0 = _context["catch"](0);
                console.error("Error handling request", _context.t0);
                res.statusCode = 500;
                res.end();

              case 16:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 11]]);
      })));
    }
  }, {
    key: "start",
    value: function start(callback) {
      this.tapeStore.load();
      this.server = http.createServer(this.handleRequest.bind(this));
      console.log("Starting talkback on ".concat(this.options.port));
      this.server.listen(this.options.port, callback);
      var closeSignalHandler = this.close.bind(this);
      process.on("exit", closeSignalHandler);
      process.on("SIGINT", closeSignalHandler);
      process.on("SIGTERM", closeSignalHandler);
      return this.server;
    }
  }, {
    key: "hasTapeBeenUsed",
    value: function hasTapeBeenUsed(tapeName) {
      return this.tapeStore.hasTapeBeenUsed(tapeName);
    }
  }, {
    key: "resetTapeUsage",
    value: function resetTapeUsage() {
      this.tapeStore.resetTapeUsage();
    }
  }, {
    key: "close",
    value: function close(callback) {
      if (this.closed) {
        return;
      }

      this.closed = true;
      this.server.close(callback);

      if (this.options.summary) {
        var summary = new Sumary(this.tapeStore.tapes);
        summary.print();
      }
    }
  }]);

  return TalkbackServer;
}();

var Logger =
/*#__PURE__*/
function () {
  function Logger(options) {
    _classCallCheck(this, Logger);

    this.options = options;

    if (this.options.debug) {
      console.debug("DEBUG mode active");
    }
  }

  _createClass(Logger, [{
    key: "log",
    value: function log(message) {
      if (!this.options.silent) {
        console.log(message);
      }
    }
  }, {
    key: "debug",
    value: function debug(message) {
      if (this.options.debug) {
        console.debug(message);
      }
    }
  }]);

  return Logger;
}();

var defaultOptions = {
  ignoreHeaders: [],
  ignoreQueryParams: [],
  ignoreBody: false,
  bodyMatcher: null,
  responseDecorator: null,
  path: "./tapes/",
  port: 8080,
  record: true,
  fallbackMode: "404",
  silent: false,
  summary: true,
  debug: false
};

var Options =
/*#__PURE__*/
function () {
  function Options() {
    _classCallCheck(this, Options);
  }

  _createClass(Options, null, [{
    key: "prepare",
    value: function prepare(usrOpts) {
      var opts = _objectSpread({}, defaultOptions, usrOpts);

      if (opts.bodyMatcher) {
        opts.ignoreHeaders.push("content-length");
      }

      opts.logger = new Logger(opts);
      return opts;
    }
  }]);

  return Options;
}();

var talkback = function talkback(usrOpts) {
  var opts = Options.prepare(usrOpts);
  return new TalkbackServer(opts);
};

module.exports = talkback;
