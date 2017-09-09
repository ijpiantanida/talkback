const Tape = require("../src/tape");

const raw = {
  meta: {
    createdAt: new Date(),
    reqHumanReadable: true,
    resHumanReadable: true
  },
  req: {
    url: "/foo/bar/1",
    method: "GET",
    headers: {
      "accept": "application/json",
      "x-ignored": "1"
    },
    body: "ABC"
  },
  res: {
    headers: {
      "accept": ["application/json"],
      "x-ignored": ["2"]
    },
    body: "ABC"
  }
};
const opts = {
  ignoreHeaders: ["x-ignored"]
};

const tape = Tape.fromStore(raw, opts);

describe("Tape", () => {
  describe(".fromStore", () => {
    it("creates a tape from the raw file data with req and res human readable", () => {
      expect(tape.req.url).to.eq("/foo/bar/1");
      expect(tape.req.headers["accept"]).to.eq("application/json");
      expect(tape.req.headers["x-ignored"]).to.be.undefined;
      expect(tape.req.body.equals(Buffer.from("ABC"))).to.be.true;

      expect(tape.res.headers["accept"]).to.eql(["application/json"]);
      expect(tape.res.headers["x-ignored"]).to.eql(["2"]);
      expect(tape.res.body.equals(Buffer.from("ABC"))).to.be.true;
    });

    it("creates a tape from the raw file data with req and res not human readable", () => {
      const newRaw = {
        ...raw,
        meta: {
          ...raw.meta,
          reqHumanReadable: false,
          resHumanReadable: false
        },
        req: {
          ...raw.req,
          body: "SGVsbG8="
        },
        res: {
          ...raw.res,
          body: "SGVsbG8="
        }
      };

      const tape = Tape.fromStore(newRaw, opts);

      expect(tape.req.url).to.eq("/foo/bar/1");
      expect(tape.req.headers["accept"]).to.eq("application/json");
      expect(tape.req.headers["x-ignored"]).to.be.undefined;
      expect(tape.req.body.equals(Buffer.from("Hello"))).to.be.true;

      expect(tape.res.headers["accept"]).to.eql(["application/json"]);
      expect(tape.res.headers["x-ignored"]).to.eql(["2"]);
      expect(tape.res.body.equals(Buffer.from("Hello"))).to.be.true;
    });
  });

  describe("#sameRequestAs", () => {
    const req = {
      url: "/foo/bar/1",
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-ignored": "1"
      },
      body: Buffer.from("QUJD", "base64")
    };

    it("returns true when everything is the same", () => {
      const tape2 = new Tape(req, opts);
      expect(tape.sameRequestAs(tape2)).to.be.true;
    });

    it("returns false when the urls are different", () => {
      const tape2 = new Tape({...req, url: "/bar"}, opts);
      expect(tape.sameRequestAs(tape2)).to.be.false;
    });

    it("returns false when the methods are different", () => {
      const tape2 = new Tape({...req, method: "POST"}, opts);
      expect(tape.sameRequestAs(tape2)).to.be.false;
    });

    it("returns false when the body are different", () => {
      const tape2 = new Tape({...req, body: Buffer.from("")}, opts);
      expect(tape.sameRequestAs(tape2)).to.be.false;
    });

    it("returns false when there are more headers", () => {
      const tape2 = new Tape({
        ...req,
        headers: {
          ...req.headers,
          "foo": "bar"
        }
      }, opts);
      expect(tape.sameRequestAs(tape2)).to.be.false;
    });

    it("returns false when there are less headers", () => {
      const headers = {...req.headers};
      delete headers["accept"];
      const tape2 = new Tape({
        ...req,
        headers
      }, opts);
      expect(tape.sameRequestAs(tape2)).to.be.false;
    });

    it("returns false when a header has a different value", () => {
      const headers = {
        ...req.headers,
        "accept": "x-form"
      };
      const tape2 = new Tape({
        ...req,
        headers
      }, opts);
      expect(tape.sameRequestAs(tape2)).to.be.false;
    });
  });
});
