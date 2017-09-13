const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
import MediaType from "./media-type";
import Tape from "./tape";

export default class TapeStore {
  constructor(options) {
    this.path = path.normalize(options.path + "/");
    this.options = options;
    this.cache = [];
  }

  load() {
    mkdirp.sync(this.path);

    const items = fs.readdirSync(this.path);
    for (let i = 0; i < items.length; i++) {
      const filename = items[i];
      const fullPath = `${this.path}${filename}`;
      const stat = fs.statSync(fullPath);
      if (!stat.isDirectory()) {
        try {
          const data = fs.readFileSync(fullPath, "utf8");
          const raw = JSON.parse(data);
          const tape = Tape.fromStore(raw, this.options);
          this.cache.push(tape);
        } catch (e) {
          console.log(`Error reading tape ${fullPath}`, e);
        }
      }
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
    const reqBody = this.bodyFor(tape.req, tape, "reqHumanReadable");
    const resBody = this.bodyFor(tape.res, tape, "resHumanReadable");

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

    const filename = `${this.path}unnamed-${this.cache.length}.json`;
    console.log(`Saving request ${tape.req.url} at ${filename}`);
    fs.writeFileSync(filename, JSON.stringify(toSave, null, 4));
  }

  bodyFor(reqResHtml, tape, metaProp) {
    const mediaType = new MediaType(reqResHtml);
    if (mediaType.isHumanReadable()) {
      tape.meta[metaProp] = true;
      return reqResHtml.body.toString("utf8");
    } else {
      return reqResHtml.body.toString("base64");
    }
  }
}
