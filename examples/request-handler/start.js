var talkback
if (process.env.USE_NPM) {
  talkback = require("talkback")
  console.log("Using NPM talkback")
} else {
  talkback = require("../../dist")
}
const puppeteer = require("puppeteer")

const host = "https://api.github.com"


async function start() {
  const requestHandler = await talkback.requestHandler({
    host: host,
    path: __dirname + "/tapes",
    record: process.env.RECORD === "true" ? talkback.Options.RecordMode.NEW : talkback.Options.RecordMode.DISABLED,
    debug: true,
    name: "Test Request Handler",
    ignoreHeaders: ['user-agent']
  })

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.setRequestInterception(true)
  page.on("request", async interceptedRequest => {
    if (interceptedRequest.url().startsWith(host)) {
      let body = Buffer.alloc(0)
      if (interceptedRequest.postData()) {
        body = Buffer.from(interceptedRequest.postData())
      }

      const talkbackRequest = {
        url: interceptedRequest.url().substr(host.length),
        method: interceptedRequest.method(),
        headers: interceptedRequest.headers(),
        body: body
      }

      requestHandler.handle(talkbackRequest)
      .then(r => interceptedRequest.respond(r))
      .catch(error => {
        console.log("Error handling talkback request", error)
        interceptedRequest.abort()
      })
    } else {
      interceptedRequest.continue()
    }
  })

  await page.goto("file://" + __dirname + "/index.html", {waitUntil: "networkidle2"})
  const elementContent = await page.$eval("#content", e => e.innerText)
  await browser.close()

  if (elementContent === "ijpiantanida") {
    console.log("SUCCESS")
  } else {
    console.log("FAILED")
  }

}

start()
.catch(err => {
  console.log(err);
})
