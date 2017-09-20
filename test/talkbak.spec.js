import talkbak from "../src/index";
import testServer from "./support/test-server";

const JSON5 = require("json5");
const fs = require("fs");
const fetch = require("node-fetch");

let talkback, proxiedServer;
const proxiedPort = 8898;
const proxiedHost = `http://localhost:${proxiedPort}`;
const tapesPath = __dirname + "/tapes";

const startTalkback = async (record) => {
  const talkback = talkbak({
    path: tapesPath,
    port: 8899,
    host: proxiedHost,
    record
  });
  await talkback.start();
  return talkback;
};

describe("talkback", async () => {
  beforeEach(async () => {
    // Delete all unnamed tapes
    const files = fs.readdirSync(tapesPath);
    for (let i = 0, len = files.length; i < len; i++) {
      const match = files[i].match(/unnamed-/);
      if (match !== null) {
        fs.unlinkSync(tapesPath + "/" + files[i]);
      }
    }
  });

  before(async () => {
    proxiedServer = testServer();
    await proxiedServer.listen(proxiedPort);
  });

  after(() => {
    proxiedServer.close();
  });

  afterEach(() => {
    talkback.close();
  });

  it("proxies and creates a new tape when the request is unknown with human readable req and res", async () => {
    talkback = await startTalkback(true);

    const reqBody = JSON.stringify({foo: "bar"});
    const headers = {"content-type": "application/json"};
    const res = await fetch("http://localhost:8899/test/1", {compress: false, method: "POST", headers, body: reqBody});
    expect(res.status).to.eq(200);

    const expectedResBody = {ok: true, body: {foo: "bar"}};
    const body = await res.json();
    expect(body).to.eql(expectedResBody);

    const tape = JSON5.parse(fs.readFileSync(tapesPath + "/unnamed-2.json5"));
    expect(tape.meta.reqHumanReadable).to.eq(true);
    expect(tape.meta.resHumanReadable).to.eq(true);
    expect(tape.req.url).to.eql("/test/1");
    expect(JSON.parse(tape.res.body)).to.eql(expectedResBody);
  });

  it("proxies and creates a new tape when the request is unknown with non-human readable req and res", async () => {
    talkback = await startTalkback(true);

    const reqBody = JSON.stringify({foo: "bar"});
    const res = await fetch("http://localhost:8899/test/2", {compress: false, method: "POST", body: reqBody});
    expect(res.status).to.eq(200);

    const expectedResBody = {ok: true, body: {foo: "bar"}};
    const body = await res.json();
    expect(body).to.eql(expectedResBody);

    const tape = JSON5.parse(fs.readFileSync(tapesPath + "/unnamed-2.json5"));
    expect(tape.meta.reqHumanReadable).to.be.undefined;
    expect(tape.meta.resHumanReadable).to.be.undefined;
    expect(tape.req.url).to.eql("/test/2");
    expect(tape.res.body).to.eql("eyJvayI6dHJ1ZSwiYm9keSI6eyJmb28iOiJiYXIifX0=");
  });

  it("loads existing tapes and uses them if they match", async () => {
    talkback = await startTalkback(false);

    const res = await fetch("http://localhost:8899/test/3", {compress: false});
    expect(res.status).to.eq(200);

    const body = await res.json();
    expect(body).to.eql({ok: true});
  });

  it("returns a 404 if recording is disabled and the request is unknown", async () => {
    talkback = await startTalkback(false);

    const res = await fetch("http://localhost:8899/test/1", {compress: false});
    expect(res.status).to.eq(404);
  });
});
