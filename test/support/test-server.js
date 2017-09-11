const http = require("http");

const testServer = () => {
  return http.createServer(async (req, res) => {
    let reqBody = [];
    req.on("error", (err) => {
      console.error(err);
    }).on("data", (chunk) => {
      reqBody.push(chunk);
    }).on("end", async () => {
      switch (req.url) {
        case "/test/1": {
          reqBody = Buffer.concat(reqBody);
          const headers = {
            "content-type": "application/json"
          };
          res.writeHead(200, headers);
          const bodyAsJson = JSON.parse(reqBody.toString());
          res.end(JSON.stringify({ok: true, body: bodyAsJson}));
          return;
        }
        case "/test/2": {
          reqBody = Buffer.concat(reqBody);
          res.writeHead(200, {});
          const bodyAsJson = JSON.parse(reqBody.toString());
          res.end(JSON.stringify({ok: true, body: bodyAsJson}));
          return;
        }
        case "/test/3": {
          res.writeHead(500);
          res.end();
          return;
        }
        default: {
          res.writeHead(404);
          res.end();
          return;
        }
      }
    });
  });
};

module.exports = testServer;
