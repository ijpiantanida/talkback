const http = require("http");
const fetch = require("node-fetch");
const fs = require("fs");

import Summary from "./summary";
import Tape from "./tape";
import TapeStore from "./tape-store";

export default class TalkbackServer {
  constructor(options) {
    this.options = options;
    this.tapeStore = new TapeStore(this.options);
  }

  onNoRecord(req) {
    console.log(`Tape for ${req.url} not found and recording is disabled`);
    console.log({
      url: req.url,
      headers: req.headers
    });
    return {
      status: 404
    };
  }

  async makeRealRequest(req) {
    const {method, url, body} = req;
    const headers = {...req.headers};
    delete headers.host;

    const host = this.options.host;
    console.log(`Making real request to ${host}${url}`);

    const fRes = await fetch(host + url, {method, headers, body, compress: false});
    const buff = await fRes.buffer();
    return {
      status: fRes.status,
      headers: fRes.headers.raw(),
      body: buff
    };
  }

  handleRequest(req, res) {
    let reqBody = [];
    req.on("data", (chunk) => {
      reqBody.push(chunk);
    }).on("end", async () => {
      reqBody = Buffer.concat(reqBody);
      req.body = reqBody;
      const tape = new Tape(req, this.options);
      let fRes = this.tapeStore.find(tape);

      if (!fRes) {
        if (this.options.record) {
          fRes = await this.makeRealRequest(req);
          tape.res = {...fRes};
          this.tapeStore.save(tape);
        } else {
          fRes = this.onNoRecord(req);
        }
      }

      res.writeHead(fRes.status, fRes.headers);
      res.end(fRes.body);
    });
  }

  start(callback) {
    this.tapeStore.load();
    this.server = http.createServer(this.handleRequest.bind(this));
    this.server.listen(this.options.port, callback);

    const closeSignalHandler = this.close.bind(this);
    process.on("exit", closeSignalHandler);
    process.on("SIGINT", closeSignalHandler);
    process.on("SIGTERM", closeSignalHandler);

    return this.server;
  }

  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.server.close();

    if (this.options.summary) {
      const summary = new Summary(this.tapeStore.tapes);
      summary.print();
    }
  }
}
