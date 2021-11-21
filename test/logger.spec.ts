import {ConsoleLogger, NoopLogger} from "../src/logger"
import OptionsFactory, {Options} from "../src/options"
import * as td from "testdouble"

let log: Function, debug: Function, error: Function, options: Options
describe("Logger", () => {
  beforeEach(() => {
    log = td.replace(console, "log")
    debug = td.replace(console, "debug")
    error = td.replace(console, "error")
  })

  describe("ConsoleLogger", () => {
    beforeEach(() => {
      options = OptionsFactory.prepare({
        name: "my-server"
      })

      const mockedDate = new Date(Date.UTC(2021, 9, 23, 15, 23, 19))

      td.replace(global, 'Date', () => mockedDate)
    })

    afterEach(() => td.reset())

    describe("#info", () => {
      it("does nothing if silent option is enabled", () => {
        const logger = new ConsoleLogger({...options, silent: true})
        logger.info("Test")

        td.verify(log(td.matchers.anything()), {times: 0})
      })

      it("writes to log if silent option is enabled but debug is enabled", () => {
        const logger = new ConsoleLogger({...options, silent: true, debug: true})
        logger.info("Test")

        td.verify(log("2021-10-23T15:23:19.000Z [my-server] [INFO] Test"))
      })

      it("writes to log console if silent option is disabled", () => {
        const logger = new ConsoleLogger({...options, silent: false})
        logger.info("Test")

        td.verify(log("2021-10-23T15:23:19.000Z [my-server] [INFO] Test"))
      })

      it("serializes objects when logged", () => {
        const logger = new ConsoleLogger({...options});
        logger.info({test: true})

        td.verify(log("2021-10-23T15:23:19.000Z [my-server] [INFO] {\"test\":true}"))
      })
    })

    describe("#debug", () => {
      it("does nothing if debug option is disabled", () => {
        const logger = new ConsoleLogger({...options, debug: false})
        logger.debug("Test")

        td.verify(debug(td.matchers.anything()), {times: 0})
      })

      it("writes to debug console if debug option is enabled", () => {
        const logger = new ConsoleLogger({...options, debug: true})
        logger.debug("Test")

        td.verify(debug("2021-10-23T15:23:19.000Z [my-server] [DEBUG] Test"))
      })
    })

    describe("#error", () => {
      it("writes to error console if silent option is enabled", () => {
        const logger = new ConsoleLogger({...options, silent: true})
        logger.error("Test")

        td.verify(error("2021-10-23T15:23:19.000Z [my-server] [ERROR] Test"))
      })

      it("writes to error console if silent option is disabled", () => {
        const logger = new ConsoleLogger({...options, silent: false})
        logger.error("Test")

        td.verify(error("2021-10-23T15:23:19.000Z [my-server] [ERROR] Test"))
      })
    })
  })

  describe("NoopLogger", () => {
    it("logs nothing", () => {
      const logger = new NoopLogger()
      logger.info("Something")
      logger.debug("Something")
      logger.error("Something")

      td.verify(log(td.matchers.anything()), {times: 0})
      td.verify(debug(td.matchers.anything()), {times: 0})
      td.verify(error(td.matchers.anything()), {times: 0})
    })
  })
})