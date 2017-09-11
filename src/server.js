const http = require("http");
const fetch = require("node-fetch");

const Tape = require("./tape");
const TapeStore = require("./tape-store");

class TalkbackServer {
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

  start(callback) {
    this.tapeStore.load();
    this.server = http.createServer((req, res) => {
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
    });
    this.server.listen(this.options.port, callback);
    return this.server;
  }

  close() {
    this.server.close();
  }
}

module.exports = TalkbackServer;
