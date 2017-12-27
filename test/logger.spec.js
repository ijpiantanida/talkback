import Logger from "../src/logger";

let log;
describe("Logger", () => {
  before(() => {
    log = td.replace(console, 'log');
  });

  after(() => td.reset());

  describe("#log", () => {
    it("does nothing if silent option is enabled", () => {
      const logger = new Logger({silent: true});
      logger.log("Test");

      td.verify(log("Test"), {times: 0});
    });

    it("does nothing if silent option is enabled", () => {
      const logger = new Logger({silent: false});
      logger.log("Test");

      td.verify(log("Test"));
    });
  });
});
