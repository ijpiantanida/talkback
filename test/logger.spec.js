import Logger from "../src/logger";

let log, debug;
describe("Logger", () => {
  beforeEach(() => {
    log = td.replace(console, 'log');
    debug = td.replace(console, 'debug');
  });

  afterEach(() => td.reset());

  describe("#log", () => {
    it("does nothing if silent option is enabled", () => {
      const logger = new Logger({silent: true});
      logger.log("Test");

      td.verify(log("Test"), {times: 0});
    });

    it("does nothing if silent option is disabled", () => {
      const logger = new Logger({silent: false});
      logger.log("Test");

      td.verify(log("Test"));
    });
  });

  describe("#debug", () => {
    it("does nothing if debug option is disabled", () => {
      const logger = new Logger({debug: false});
      logger.debug("Test");

      td.verify(debug("Test"), {times: 0});
    });

    it("does nothing if debug option is enabled", () => {
      const logger = new Logger({debug: true});
      logger.debug("Test");

      td.verify(debug("Test"));
    });
  });
});
