'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('@babel/runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('@babel/runtime/helpers/asyncToGenerator'));
var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('@babel/runtime/helpers/createClass'));
var _objectSpread = _interopDefault(require('@babel/runtime/helpers/objectSpread'));
var _toConsumableArray = _interopDefault(require('@babel/runtime/helpers/toConsumableArray'));

var Headers = {
  read: function read(headers, headerName) {
    var value = headers[headerName];

    if (Array.isArray(value)) {
      return value[0];
    } else {
      return value;
    }
  },
  write: function write(headers, headerName, value, type) {
    var writeValue = type === "req" ? value : [value];
    headers[headerName] = writeValue;
  }
};

var contentTypeParser = require("content-type");
var jsonTypes = ["application/json"];
var humanReadableContentTypes = ["application/javascript", "text/css", "text/html", "text/javascript", "text/plain"].concat(jsonTypes);

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
      var contentEncoding = Headers.read(this.headers(), "content-encoding");
      var notCompressed = !contentEncoding || contentEncoding === "identity";
      var contentType = this.contentType();

      if (!contentType) {
        return false;
      }

      return notCompressed && humanReadableContentTypes.indexOf(contentType.type) >= 0;
    }
  }, {
    key: "isJSON",
    value: function isJSON() {
      var contentType = this.contentType();

      if (!contentType) {
        return false;
      }

      return jsonTypes.indexOf(contentType.type) >= 0;
    }
  }, {
    key: "contentType",
    value: function contentType() {
      var contentType = Headers.read(this.headers(), "content-type");

      if (!contentType) {
        return null;
      }

      return contentTypeParser.parse(contentType);
    }
  }, {
    key: "headers",
    value: function headers() {
      return this.htmlReqRes.headers;
    }
  }]);

  return MediaType;
}();

var bufferShim = require("buffer-shims");

var TapeRenderer =
/*#__PURE__*/
function () {
  function TapeRenderer(tape) {
    _classCallCheck(this, TapeRenderer);

    this.tape = tape;
  }

  _createClass(TapeRenderer, [{
    key: "render",
    value: function render() {
      var reqBody = this.bodyFor(this.tape.req, "req");
      var resBody = this.bodyFor(this.tape.res, "res");
      return {
        meta: this.tape.meta,
        req: _objectSpread({}, this.tape.req, {
          body: reqBody
        }),
        res: _objectSpread({}, this.tape.res, {
          body: resBody
        })
      };
    }
  }, {
    key: "bodyFor",
    value: function bodyFor(reqResObj, metaPrefix) {
      var mediaType = new MediaType(reqResObj);
      var bodyLength = reqResObj.body.length;

      if (mediaType.isHumanReadable() && bodyLength > 0) {
        this.tape.meta[metaPrefix + "HumanReadable"] = true;
        var rawBody = reqResObj.body.toString("utf8");

        if (mediaType.isJSON()) {
          return JSON.parse(reqResObj.body);
        } else {
          return rawBody;
        }
      } else {
        return reqResObj.body.toString("base64");
      }
    }
  }], [{
    key: "fromStore",
    value: function fromStore(raw, options) {
      var req = _objectSpread({}, raw.req);

      req.body = this.prepareBody(raw, req, "req");
      var tape = new Tape(req, options);
      tape.meta = raw.meta;
      tape.res = _objectSpread({}, raw.res);
      tape.res.body = this.prepareBody(tape, tape.res, "res");
      return tape;
    }
  }, {
    key: "prepareBody",
    value: function prepareBody(tape, reqResObj, metaPrefix) {
      if (tape.meta[metaPrefix + "HumanReadable"]) {
        var mediaType = new MediaType(reqResObj);
        var isResAnObject = typeof reqResObj.body === "object";

        if (isResAnObject && mediaType.isJSON()) {
          var json = JSON.stringify(reqResObj.body, null, 2);

          if (Headers.read(reqResObj.headers, "content-length")) {
            Headers.write(reqResObj.headers, "content-length", json.length, metaPrefix);
          }

          return bufferShim.from(json);
        } else {
          return bufferShim.from(reqResObj.body);
        }
      } else {
        return bufferShim.from(reqResObj.body, "base64");
      }
    }
  }]);

  return TapeRenderer;
}();

var URL = require("url");

var querystring = require("querystring");

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
    this.cleanupHeaders();
    this.queryParamsToIgnore = this.options.ignoreQueryParams;
    this.cleanupQueryParams();
    this.normalizeBody();
    this.meta = {
      createdAt: new Date(),
      host: this.options.host
    };
  }

  _createClass(Tape, [{
    key: "cleanupHeaders",
    value: function cleanupHeaders() {
      var newHeaders = _objectSpread({}, this.req.headers);

      this.options.ignoreHeaders.forEach(function (h) {
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
    key: "normalizeBody",
    value: function normalizeBody() {
      var mediaType = new MediaType(this.req);

      if (mediaType.isJSON() && this.req.body.length > 0) {
        this.req.body = Buffer.from(JSON.stringify(JSON.parse(this.req.body), null, 2));
      }
    }
  }, {
    key: "clone",
    value: function clone() {
      var raw = new TapeRenderer(this).render();
      return Tape.fromStore(raw, this.options);
    }
  }], [{
    key: "fromStore",
    value: function fromStore() {
      return TapeRenderer.fromStore.apply(TapeRenderer, arguments);
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
        var newTape, matchingTape, resObj, responseTape, resTape;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                newTape = new Tape(req, this.options);
                matchingTape = this.tapeStore.find(newTape);

                if (!matchingTape) {
                  _context.next = 6;
                  break;
                }

                responseTape = matchingTape;
                _context.next = 19;
                break;

              case 6:
                if (!this.options.record) {
                  _context.next = 14;
                  break;
                }

                _context.next = 9;
                return this.makeRealRequest(req);

              case 9:
                resObj = _context.sent;
                newTape.res = _objectSpread({}, resObj);
                this.tapeStore.save(newTape);
                _context.next = 18;
                break;

              case 14:
                _context.next = 16;
                return this.onNoRecord(req);

              case 16:
                resObj = _context.sent;
                newTape.res = _objectSpread({}, resObj);

              case 18:
                responseTape = newTape;

              case 19:
                resObj = responseTape.res;

                if (this.options.responseDecorator) {
                  resTape = this.options.responseDecorator(responseTape.clone(), req);

                  if (resTape.res.headers["content-length"]) {
                    resTape.res.headers["content-length"] = resTape.res.body.length;
                  }

                  resObj = resTape.res;
                }

                return _context.abrupt("return", resObj);

              case 22:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function handle(_x) {
        return _handle.apply(this, arguments);
      }

      return handle;
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
                  headers: [],
                  body: "talkback - tape not found"
                });

              case 8:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function onNoRecord(_x2) {
        return _onNoRecord.apply(this, arguments);
      }

      return onNoRecord;
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
                  compress: false,
                  redirect: "manual"
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

      function makeRealRequest(_x3) {
        return _makeRealRequest.apply(this, arguments);
      }

      return makeRealRequest;
    }()
  }]);

  return RequestHandler;
}();

var Sumary =
/*#__PURE__*/
function () {
  function Sumary(tapes, opts) {
    _classCallCheck(this, Sumary);

    this.tapes = tapes;
    this.opts = opts;
  }

  _createClass(Sumary, [{
    key: "print",
    value: function print() {
      console.log("===== SUMMARY (".concat(this.opts.name, ") ====="));
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
        if (!this.options.urlMatcher) {
          this.options.logger.debug("Not same URL ".concat(req.url, " vs ").concat(otherReq.url));
          return false;
        }

        var urlMatches = this.options.urlMatcher(this.tape, otherReq);

        if (!urlMatches) {
          this.options.logger.debug("Not same urlMatcher ".concat(req.url, " vs ").concat(otherReq.url));
          return false;
        }
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
        var mediaType = new MediaType(req);
        var sameBody = false;

        if (mediaType.isJSON() && req.body.length > 0 && otherReq.body.length > 0) {
          sameBody = JSON.stringify(JSON.parse(req.body.toString())) === JSON.stringify(JSON.parse(otherReq.body.toString()));
        } else {
          sameBody = req.body.equals(otherReq.body);
        }

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
      this.loadTapesAtDir(this.path);
      console.log("Loaded ".concat(this.tapes.length, " tapes"));
    }
  }, {
    key: "loadTapesAtDir",
    value: function loadTapesAtDir(directory) {
      var items = fs.readdirSync(directory);

      for (var i = 0; i < items.length; i++) {
        var filename = items[i];
        var fullPath = "".concat(directory).concat(filename);
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
        } else {
          this.loadTapesAtDir(fullPath + "/");
        }
      }
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
      var toSave = new TapeRenderer(tape).render();
      var tapeName = "unnamed-".concat(this.currentTapeId(), ".json5");
      tape.path = tapeName;
      var filename = this.path + tapeName;
      this.options.logger.log("Saving request ".concat(tape.req.url, " at ").concat(filename));
      fs.writeFileSync(filename, JSON5.stringify(toSave, null, 4));
    }
  }, {
    key: "currentTapeId",
    value: function currentTapeId() {
      return this.tapes.length;
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

var https = require("https");

var fs$1 = require("fs");

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
      var _this2 = this;

      this.tapeStore.load();
      var app = this.handleRequest.bind(this);
      var serverFactory = this.options.https.enabled ? function () {
        var httpsOpts = {
          key: fs$1.readFileSync(_this2.options.https.keyPath),
          cert: fs$1.readFileSync(_this2.options.https.certPath)
        };
        return https.createServer(httpsOpts, app);
      } : function () {
        return http.createServer(app);
      };
      this.server = serverFactory();
      console.log("Starting talkback on ".concat(this.options.port));
      this.server.listen(this.options.port, callback);
      this.closeSignalHandler = this.close.bind(this);
      process.on("exit", this.closeSignalHandler);
      process.on("SIGINT", this.closeSignalHandler);
      process.on("SIGTERM", this.closeSignalHandler);
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
      process.removeListener("exit", this.closeSignalHandler);
      process.removeListener("SIGINT", this.closeSignalHandler);
      process.removeListener("SIGTERM", this.closeSignalHandler);

      if (this.options.summary) {
        var summary = new Sumary(this.tapeStore.tapes, this.options);
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
  port: 8080,
  path: "./tapes/",
  record: true,
  name: "unnamed",
  https: {
    enabled: false,
    keyPath: null,
    certPath: null
  },
  ignoreHeaders: ["content-length", "host"],
  ignoreQueryParams: [],
  ignoreBody: false,
  bodyMatcher: null,
  urlMatcher: null,
  responseDecorator: null,
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
    value: function prepare() {
      var usrOpts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var opts = _objectSpread({}, defaultOptions, {
        name: usrOpts.host
      }, usrOpts, {
        ignoreHeaders: [].concat(_toConsumableArray(defaultOptions.ignoreHeaders), _toConsumableArray(usrOpts.ignoreHeaders || []))
      });

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
