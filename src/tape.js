class Tape {
  constructor(req, options) {
    this.req = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body
    };
    this.options = options;
    this.headersToIgnore = ["host"].concat(this.options.ignoreHeaders);
    this.cleanupHeaders();
    this.meta = {
      createdAt: new Date(),
      host: this.options.host
    };
  }

  static fromStore(raw, options) {
    const req = {...raw.req};
    if (raw.meta.resHumanReadable) {
      req.body = Buffer.from(raw.req.body);
    } else {
      req.body = Buffer.from(raw.req.body, "base64");
    }

    const tape = new Tape(req, options);
    tape.meta = raw.meta;
    tape.res = {...raw.res};
    if (tape.meta.resHumanReadable) {
      tape.res.body = Buffer.from(tape.res.body);
    } else {
      tape.res.body = Buffer.from(raw.res.body, "base64");
    }
    return tape;
  }

  cleanupHeaders() {
    const newHeaders = {...this.req.headers};
    this.headersToIgnore.forEach(h => delete newHeaders[h]);
    this.req = {
      ...this.req,
      headers: newHeaders
    };
  }

  sameRequestAs(tape) {
    const req = tape.req;
    const numberOfHeaders = Object.keys(req.headers).length;
    let same = this.req.url === req.url && this.req.method === req.method && this.req.body.equals(req.body);
    if (!same) {
      return false;
    }
    if (numberOfHeaders !== Object.keys(this.req.headers).length) {
      return false;
    }
    let headersSame = true;
    Object.keys(this.req.headers).forEach(k => {
      const entryHeader = this.req.headers[k];
      const header = req.headers[k];

      headersSame = headersSame && entryHeader === header;
    });
    return headersSame;
  }
}

module.exports = Tape;
