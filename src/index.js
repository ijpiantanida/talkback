import Server from "./server";
import Logger from "./logger";

const defaultOptions = {
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

const talkback = usrOpts => {
  const opts = {
    ...defaultOptions,
    ...usrOpts
  };

  const logger = new Logger(opts);
  opts.logger = logger;

  return new Server(opts);
};

export default talkback;