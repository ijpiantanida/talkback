'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));
var _JSON$stringify = _interopDefault(require('babel-runtime/core-js/json/stringify'));
var _Object$keys = _interopDefault(require('babel-runtime/core-js/object/keys'));
var _extends = _interopDefault(require('babel-runtime/helpers/extends'));
var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));

var Sumary = function () {
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
          return console.log("- " + t.path);
        });
      }
      var unusedTapes = this.tapes.filter(function (t) {
        return !t.used;
      });
      if (unusedTapes.length > 0) {
        console.log("Unused tapes:");
        unusedTapes.forEach(function (t) {
          return console.log("- " + t.path);
        });
      }
    }
  }]);

  return Sumary;
}();

var URL = require("url");
var querystring = require("querystring");
var bufferShim = require("buffer-shims");

var Tape = function () {
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
      var newHeaders = _extends({}, this.req.headers);
      this.headersToIgnore.forEach(function (h) {
        return delete newHeaders[h];
      });
      this.req = _extends({}, this.req, {
        headers: newHeaders
      });
    }
  }, {
    key: "cleanupQueryParams",
    value: function cleanupQueryParams() {
      if (this.queryParamsToIgnore.length === 0) {
        return;
      }

      var url = URL.parse(this.req.url, { parseQueryString: true });
      if (!url.search) {
        return;
      }

      var query = _extends({}, url.query);
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
    key: "sameRequestAs",
    value: function sameRequestAs(otherTape) {
      var _this = this;

      var otherReq = otherTape.req;
      var sameURL = this.req.url === otherReq.url;
      if (!sameURL) {
        this.options.logger.debug("Not same URL " + this.req.url + " vs " + otherReq.url);
        return false;
      }
      var sameMethod = this.req.method === otherReq.method;
      if (!sameMethod) {
        this.options.logger.debug("Not same METHOD " + this.req.method + " vs " + otherReq.method);
        return false;
      }

      if (!this.options.ignoreBody) {
        var sameBody = this.req.body.equals(otherReq.body);
        if (!sameBody) {
          this.options.logger.debug("Not same BODY " + this.req.body + " vs " + otherReq.body);
          return false;
        }
      }
      var currentHeadersLength = _Object$keys(this.req.headers).length;
      var otherHeadersLength = _Object$keys(otherReq.headers).length;
      var sameNumberOfHeaders = currentHeadersLength === otherHeadersLength;
      if (!sameNumberOfHeaders) {
        this.options.logger.debug("Not same #HEADERS " + _JSON$stringify(this.req.headers) + " vs " + _JSON$stringify(otherReq.headers));
        return false;
      }

      var headersSame = true;
      _Object$keys(this.req.headers).forEach(function (k) {
        var entryHeader = _this.req.headers[k];
        var header = otherReq.headers[k];

        headersSame = headersSame && entryHeader === header;
      });
      if (!headersSame) {
        this.options.logger.debug("Not same HEADERS values " + _JSON$stringify(this.req.headers) + " vs " + _JSON$stringify(otherReq.headers));
      }
      return headersSame;
    }
  }], [{
    key: "fromStore",
    value: function fromStore(raw, options) {
      var req = _extends({}, raw.req);
      if (raw.meta.reqHumanReadable) {
        req.body = bufferShim.from(raw.req.body);
      } else {
        req.body = bufferShim.from(raw.req.body, "base64");
      }

      var tape = new Tape(req, options);
      tape.meta = raw.meta;
      tape.res = _extends({}, raw.res);
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

var contentTypeParser = require("content-type");

var humanReadableContentTypes = ["application/javascript", "application/json", "text/css", "text/html", "text/javascript", "text/plain"];

var MediaType = function () {
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

var fs = require("fs");
var path = require("path");
var JSON5 = require("json5");
var mkdirp = require("mkdirp");

var TapeStore = function () {
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
        var fullPath = "" + this.path + filename;
        var stat = fs.statSync(fullPath);
        if (!stat.isDirectory()) {
          try {
            var data = fs.readFileSync(fullPath, "utf8");
            var raw = JSON5.parse(data);
            var tape = Tape.fromStore(raw, this.options);
            tape.path = filename;
            this.tapes.push(tape);
          } catch (e) {
            console.log("Error reading tape " + fullPath, e.message);
          }
        }
      }
      console.log("Loaded " + this.tapes.length + " tapes");
    }
  }, {
    key: "find",
    value: function find(newTape) {
      var _this = this;

      var foundTape = this.tapes.find(function (t) {
        _this.options.logger.debug("Comparing against tape " + t.path);
        return newTape.sameRequestAs(t);
      });
      if (foundTape) {
        foundTape.used = true;
        this.options.logger.log("Serving cached request for " + newTape.req.url + " from tape " + foundTape.path);
        return foundTape.res;
      }
    }
  }, {
    key: "save",
    value: function save(tape) {
      var _tape$req = tape.req,
          url = _tape$req.url,
          method = _tape$req.method,
          headers = _tape$req.headers;

      var reqBody = this.bodyFor(tape.req, tape, "reqHumanReadable");
      var resBody = this.bodyFor(tape.res, tape, "resHumanReadable");

      tape.new = true;
      tape.used = true;
      this.tapes.push(tape);

      var toSave = {
        meta: tape.meta,
        req: {
          url: url,
          method: method,
          headers: headers,
          body: reqBody
        },
        res: _extends({}, tape.res, {
          body: resBody
        })
      };

      var tapeName = "unnamed-" + this.tapes.length + ".json5";
      tape.path = tapeName;
      var filename = this.path + tapeName;
      this.options.logger.log("Saving request " + tape.req.url + " at " + filename);
      fs.writeFileSync(filename, JSON5.stringify(toSave, null, 4));
    }
  }, {
    key: "bodyFor",
    value: function bodyFor(reqResHtml, tape, metaProp) {
      var mediaType = new MediaType(reqResHtml);
      if (mediaType.isHumanReadable()) {
        tape.meta[metaProp] = true;
        return reqResHtml.body.toString("utf8");
      } else {
        return reqResHtml.body.toString("base64");
      }
    }
  }]);

  return TapeStore;
}();

var http = require("http");
var fetch = require("node-fetch");

var TalkbackServer = function () {
  function TalkbackServer(options) {
    _classCallCheck(this, TalkbackServer);

    this.options = options;
    this.tapeStore = new TapeStore(this.options);
  }

  _createClass(TalkbackServer, [{
    key: "onNoRecord",
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(req) {
        var fallbackMode;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                fallbackMode = this.options.fallbackMode;

                this.options.logger.log("Tape for " + req.url + " not found and recording is disabled (fallbackMode: " + fallbackMode + ")");
                this.options.logger.log({
                  url: req.url,
                  headers: req.headers
                });

                if (!(fallbackMode == "proxy")) {
                  _context.next = 7;
                  break;
                }

                _context.next = 6;
                return this.makeRealRequest(req);

              case 6:
                return _context.abrupt("return", _context.sent);

              case 7:
                return _context.abrupt("return", {
                  status: 404,
                  body: "talkback - tape not found"
                });

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function onNoRecord(_x) {
        return _ref.apply(this, arguments);
      }

      return onNoRecord;
    }()
  }, {
    key: "makeRealRequest",
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(req) {
        var method, url, body, headers, host, fRes, buff;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                method = req.method, url = req.url, body = req.body;
                headers = _extends({}, req.headers);

                delete headers.host;

                host = this.options.host;

                this.options.logger.log("Making real request to " + host + url);

                if (method === "GET" || method === "HEAD") {
                  body = null;
                }

                _context2.next = 8;
                return fetch(host + url, { method: method, headers: headers, body: body, compress: false });

              case 8:
                fRes = _context2.sent;
                _context2.next = 11;
                return fRes.buffer();

              case 11:
                buff = _context2.sent;
                return _context2.abrupt("return", {
                  status: fRes.status,
                  headers: fRes.headers.raw(),
                  body: buff
                });

              case 13:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function makeRealRequest(_x2) {
        return _ref2.apply(this, arguments);
      }

      return makeRealRequest;
    }()
  }, {
    key: "handleRequest",
    value: function handleRequest(req, res) {
      var _this = this;

      var reqBody = [];
      req.on("data", function (chunk) {
        reqBody.push(chunk);
      }).on("end", _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        var tape, fRes;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.prev = 0;

                reqBody = Buffer.concat(reqBody);
                req.body = reqBody;
                tape = new Tape(req, _this.options);
                fRes = _this.tapeStore.find(tape);

                if (fRes) {
                  _context3.next = 17;
                  break;
                }

                if (!_this.options.record) {
                  _context3.next = 14;
                  break;
                }

                _context3.next = 9;
                return _this.makeRealRequest(req);

              case 9:
                fRes = _context3.sent;

                tape.res = _extends({}, fRes);
                _this.tapeStore.save(tape);
                _context3.next = 17;
                break;

              case 14:
                _context3.next = 16;
                return _this.onNoRecord(req);

              case 16:
                fRes = _context3.sent;

              case 17:

                res.writeHead(fRes.status, fRes.headers);
                res.end(fRes.body);
                _context3.next = 26;
                break;

              case 21:
                _context3.prev = 21;
                _context3.t0 = _context3["catch"](0);

                console.error("Error handling request", _context3.t0);
                res.statusCode = 500;
                res.end();

              case 26:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, _this, [[0, 21]]);
      })));
    }
  }, {
    key: "start",
    value: function start(callback) {
      this.tapeStore.load();
      this.server = http.createServer(this.handleRequest.bind(this));
      console.log("Starting talkbak on " + this.options.port);
      this.server.listen(this.options.port, callback);

      var closeSignalHandler = this.close.bind(this);
      process.on("exit", closeSignalHandler);
      process.on("SIGINT", closeSignalHandler);
      process.on("SIGTERM", closeSignalHandler);

      return this.server;
    }
  }, {
    key: "close",
    value: function close() {
      if (this.closed) {
        return;
      }
      this.closed = true;
      this.server.close();

      if (this.options.summary) {
        var summary = new Sumary(this.tapeStore.tapes);
        summary.print();
      }
    }
  }]);

  return TalkbackServer;
}();

var Logger = function () {
  function Logger() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
  path: "./tapes/",
  port: 8080,
  record: true,
  fallbackMode: "404",
  silent: false,
  summary: true,
  debug: false
};

var talkback = function talkback(usrOpts) {
  var opts = _extends({}, defaultOptions, usrOpts);

  var logger = new Logger(opts);
  opts.logger = logger;

  return new TalkbackServer(opts);
};

module.exports = talkback;
