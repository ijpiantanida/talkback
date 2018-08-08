const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");
const mkdirp = require("mkdirp");
import MediaType from "./media-type";
import Tape from "./tape";
import TapeMatcher from "./tape-matcher"

export default class TapeStore {
  constructor(options) {
    this.path = path.normalize(options.path + "/");
    this.options = options;
    this.tapes = [];
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
          const raw = JSON5.parse(data);
          const tape = Tape.fromStore(raw, this.options);
          tape.path = filename;
          this.tapes.push(tape);
        } catch (e) {
          console.log(`Error reading tape ${fullPath}`, e.message);
        }
      }
    }
    console.log(`Loaded ${this.tapes.length} tapes`);
  }

  find(newTape) {
    const foundTape = this.tapes.find(t => {
      this.options.logger.debug(`Comparing against tape ${t.path}`)
      return new TapeMatcher(t, this.options).sameAs(newTape);
    });
    if (foundTape) {
      foundTape.used = true;
      this.options.logger.log(`Serving cached request for ${newTape.req.url} from tape ${foundTape.path}`);
      return foundTape.res;
    }
  }

  save(tape) {
    const {url, method, headers} = tape.req;
    const reqBody = this.bodyFor(tape.req, tape, "reqHumanReadable");
    const resBody = this.bodyFor(tape.res, tape, "resHumanReadable");

    tape.new = true;
    tape.used = true;
    this.tapes.push(tape);

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

    const tapeName = `unnamed-${this.tapes.length}.json5`;
    tape.path = tapeName;
    const filename = this.path + tapeName;
    this.options.logger.log(`Saving request ${tape.req.url} at ${filename}`);
    fs.writeFileSync(filename, JSON5.stringify(toSave, null, 4));
  }

  hasTapeBeenUsed(tapeName) {
    return this.tapes.some(t => t.used && t.path === tapeName);
  }

  resetTapeUsage() {
    return this.tapes.forEach(t => t.used = false);
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
