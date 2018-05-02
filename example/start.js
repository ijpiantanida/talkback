var talkback = require("../dist/index");

var host = "https://api.github.com";
var server = talkback({
  host: host,
  path: __dirname + "/tapes",
  debug: false
});
server.start();