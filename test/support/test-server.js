const http = require("http")

const testServer = () => {
  return http.createServer(async (req, res) => {
    let reqBody = []
    req.on("error", (err) => {
      console.error(err)
    }).on("data", (chunk) => {
      reqBody.push(chunk)
    }).on("end", async () => {
      switch (req.url) {
        case "/test/1": {
          reqBody = Buffer.concat(reqBody)
          const bodyAsString = reqBody.toString()

          const headers = {
            "content-type": "application/json"
          }
          res.writeHead(200, headers)

          let body = null
          if (bodyAsString) {
            body = JSON.parse(bodyAsString)
          }

          const pingHeader = req.headers["x-talkback-ping"]
          if (pingHeader) {
            body = pingHeader
          }

          res.end(JSON.stringify({ok: true, body}))
          return
        }
        case "/test/2": {
          reqBody = Buffer.concat(reqBody)
          res.writeHead(200, {})
          const bodyAsJson = JSON.parse(reqBody.toString())
          res.end(JSON.stringify({ok: true, body: bodyAsJson}))
          return
        }
        case "/test/3": {
          res.writeHead(500)
          res.end()
          return
        }
        case "/test/head": {
          res.writeHead(200)
          res.end()
          return
        }
        case "/test/redirect/1": {
          res.writeHead(302, {
            'Location': '/test/1'
          })
          res.end()
          return
        }
        default: {
          res.writeHead(404)
          res.end()
          return
        }
      }
    })
  })
}

export default testServer
