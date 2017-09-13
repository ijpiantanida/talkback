const fs = require("fs");
import MediaType from "./media-type";
import Tape from "./tape";

export default class TapeStore {
  constructor(options) {
    this.path = options.path.endsWith("/") ? options.path : options.path + "/";
    this.options = options;
    this.cache = [];
  }

  load() {
    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path);
    }

    const items = fs.readdirSync(this.path);
    for (let i = 0; i < items.length; i++) {
      const filename = items[i];
      const data = fs.readFileSync(`${this.path}${filename}`, "utf8");
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
