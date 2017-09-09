const contentTypeParser = require("content-type");


const humanReadableContentTypes = [
  "application/javascript",
  "application/json",
  "text/css",
  "text/html",
  "text/javascript",
  "text/plain"
];

class MediaType {
  constructor(htmlReqRes) {
    this.htmlReqRes = htmlReqRes;
  }

  isHumanReadable() {
    const headers = this.htmlReqRes.headers;
    const contentEncoding = this.getHeader(headers, "content-encoding");
    let contentType = this.getHeader(headers, "content-type");
    const notCompressed = !contentEncoding || contentEncoding === "identity";

    if (!contentType) {
      return false;
    }
    contentType = contentTypeParser.parse(contentType);

    return notCompressed && humanReadableContentTypes.indexOf(contentType.type) >= 0;
  }

  getHeader(headers, headerName) {
    const value = headers[headerName];
    if (Array.isArray(value)) {
      return value[0];
    } else {
      return value;
    }
  }
}

module.exports = MediaType;
