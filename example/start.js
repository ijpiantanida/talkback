const talkback = require("../src/index");

const host = "https://api.github.com";
const server = talkback({
  host,
  path: __dirname + "/tapes"
});
server.start(() => console.log(`Talkback server for ${host} started`));