'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('babel-runtime/helpers/extends'));
var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));
var _Object$keys = _interopDefault(require('babel-runtime/core-js/object/keys'));

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
    key: "sameRequestAs",
    value: function sameRequestAs(tape) {
      var _this = this;

      var req = tape.req;
      var numberOfHeaders = _Object$keys(req.headers).length;
      var same = this.req.url === req.url && this.req.method === req.method && this.req.body.equals(req.body);
      if (!same) {
        return false;
      }
      if (numberOfHeaders !== _Object$keys(this.req.headers).length) {
        return false;
      }
      var headersSame = true;
      _Object$keys(this.req.headers).forEach(function (k) {
        var entryHeader = _this.req.headers[k];
        var header = req.headers[k];

        headersSame = headersSame && entryHeader === header;
      });
      return headersSame;
    }
  }], [{
    key: "fromStore",
    value: function fromStore(raw, options) {
      var req = _extends({}, raw.req);
      if (raw.meta.resHumanReadable) {
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

var fs$1 = require("fs");
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

      var items = fs$1.readdirSync(this.path);
      for (var i = 0; i < items.length; i++) {
        var filename = items[i];
        var fullPath = "" + this.path + filename;
        var stat = fs$1.statSync(fullPath);
        if (!stat.isDirectory()) {
          try {
            var data = fs$1.readFileSync(fullPath, "utf8");
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
      var foundTape = this.tapes.find(function (t) {
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
      fs$1.writeFileSync(filename, JSON5.stringify(toSave, null, 4));
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
var fs = require("fs");

var TalkbackServer = function () {
  function TalkbackServer(options) {
    _classCallCheck(this, TalkbackServer);

    this.options = options;
    this.tapeStore = new TapeStore(this.options);
  }

  _createClass(TalkbackServer, [{
    key: "onNoRecord",
    value: function onNoRecord(req) {
      this.options.logger.log("Tape for " + req.url + " not found and recording is disabled");
      this.options.logger.log({
        url: req.url,
        headers: req.headers
      });
      return {
        status: 404
      };
    }
  }, {
    key: "makeRealRequest",
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(req) {
        var method, url, body, headers, host, fRes, buff;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                method = req.method, url = req.url, body = req.body;
                headers = _extends({}, req.headers);

                delete headers.host;

                host = this.options.host;

                this.options.logger.log("Making real request to " + host + url);

                _context.next = 7;
                return fetch(host + url, { method: method, headers: headers, body: body, compress: false });

              case 7:
                fRes = _context.sent;
                _context.next = 10;
                return fRes.buffer();

              case 10:
                buff = _context.sent;
                return _context.abrupt("return", {
                  status: fRes.status,
                  headers: fRes.headers.raw(),
                  body: buff
                });

              case 12:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function makeRealRequest(_x) {
        return _ref.apply(this, arguments);
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
      }).on("end", _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var tape, fRes;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                reqBody = Buffer.concat(reqBody);
                req.body = reqBody;
                tape = new Tape(req, _this.options);
                fRes = _this.tapeStore.find(tape);

                if (fRes) {
                  _context2.next = 14;
                  break;
                }

                if (!_this.options.record) {
                  _context2.next = 13;
                  break;
                }

                _context2.next = 8;
                return _this.makeRealRequest(req);

              case 8:
                fRes = _context2.sent;

                tape.res = _extends({}, fRes);
                _this.tapeStore.save(tape);
                _context2.next = 14;
                break;

              case 13:
                fRes = _this.onNoRecord(req);

              case 14:

                res.writeHead(fRes.status, fRes.headers);
                res.end(fRes.body);

              case 16:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, _this);
      })));
    }
  }, {
    key: "start",
    value: function start(callback) {
      this.tapeStore.load();
      this.server = http.createServer(this.handleRequest.bind(this));
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
  function Logger(options) {
    _classCallCheck(this, Logger);

    this.options = options;
  }

  _createClass(Logger, [{
    key: "log",
    value: function log(message) {
      if (!this.options.silent) {
        console.log(message);
      }
    }
  }]);

  return Logger;
}();

var defaultOptions = {
  ignoreHeaders: [],
  path: "./tapes/",
  port: 8080,
  record: true,
  silent: false,
  summary: true
};

var talkback = function talkback(usrOpts) {
  var opts = _extends({}, defaultOptions, usrOpts);

  var logger = new Logger(opts);
  opts.logger = logger;

  return new TalkbackServer(opts);
};

module.exports = talkback;
