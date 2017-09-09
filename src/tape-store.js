const fs = require("fs");
const Tape = require("./tape");
const MediaType = require("./media-type");

class TapeStore {
  constructor(options) {
    this.path = options.path.endsWith("/") ? options.path : options.path + "/";
    this.options = options;
    this.cache = [];
  }

  async load() {
    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path);
    }

    const items = await new Promise((res, rej) => {
      fs.readdir(this.path, (err, items) => {
        if (err) {
          rej(err);
          return;
        }
        res(items);
      });
    });
    for (let i = 0; i < items.length; i++) {
      const filename = items[i];
      const data = await new Promise((res, rej) => {
        fs.readFile(`${this.path}${filename}`, "utf8", (err, file) => {
          if (err) {
            rej(err);
            return;
          }
          res(file);
        });
      });
      const raw = JSON.parse(data);
      const tape = Tape.fromStore(raw, this.options);
      this.cache.push(tape);
    }
    console.log(`Loaded ${this.cache.length} tapes`);
  }

  find(newTape) {
    const foundTape = this.cache.find(t => newTape.sameRequestAs(t));
    if (foundTape) {
      console.log(`Serving cached request for ${newTape.req.url}`);
      return foundTape.res;
    }
  }

  save(tape) {
    const {url, method, headers} = tape.req;
    let reqBody;
    const reqMediaType = new MediaType(tape.req);
    if (reqMediaType.isHumanReadable()) {
      tape.meta.reqHumanReadable = true;
      reqBody = tape.req.body.toString("utf8");
    } else {
      reqBody = tape.req.body.toString("base64");
    }

    let resBody;
    const resMediaType = new MediaType(tape.res);
    if (resMediaType.isHumanReadable()) {
      tape.meta.resHumanReadable = true;
      resBody = tape.res.body.toString("utf8");
    } else {
      resBody = tape.res.body.toString("base64");
    }
    this.cache.push(tape);

    const toSave = {
      meta: tape.meta,
      req: {
        url,
        method,
        headers,
        body: reqBody
      },
      res: {
        ...tape.res,
        body: resBody
      }
    };

    const filename = `${this.path}unnamed-${this.cache.length}`;
    console.log(`Saving request ${tape.req.url} at ${filename}`);
    return new Promise((resolve, reject) =>
      fs.writeFile(filename, JSON.stringify(toSave, null, 4), () => resolve())
    );
  }
}

module.exports = TapeStore;
