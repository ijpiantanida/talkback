const Server = require("./src/server");

const defaultOptions = {
  port: 8080,
  record: true,
  ignoreHeaders: [],
  path: "./tapes/"
};

const talkback = usrOpts => {
  const opts = {
    ...defaultOptions,
    ...usrOpts
  };
  return new Server(opts);
};

module.exports = talkback;

const server = talkback({
  port: 7788,
  host: "https://api.dicen.tech",
  ignoreHeaders: ["x-correlation-id", "asd"]
});
server.listen();