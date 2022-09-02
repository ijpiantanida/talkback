let talkback
if (process.env.USE_NPM) {
  talkback = require("talkback")
  console.log("Using NPM talkback")
} else {
  talkback = require("../../dist")
}
const puppeteer = require("puppeteer")

const githubHost = "https://api.github.com"
const weatherHost = "https://api.open-meteo.com"


async function start() {
  const requestHandlerGithub = await talkback.requestHandler({
    host: githubHost,
    path: __dirname + "/tapes/github",
    record: process.env.RECORD === "true" ? talkback.Options.RecordMode.NEW : talkback.Options.RecordMode.DISABLED,
    debug: false,
    name: "Example - Request Handler Github",
    allowHeaders: [],
    summary: true,
  })
  const requestHandlerWeather = await talkback.requestHandler({
    host: weatherHost,
    path: __dirname + "/tapes/weather",
    record: process.env.RECORD === "true" ? talkback.Options.RecordMode.NEW : talkback.Options.RecordMode.DISABLED,
    debug: false,
    name: "Example - Request Handler Weather",
    allowHeaders: [],
    summary: true,
  })

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.setRequestInterception(true)
  page.on("request", async interceptedRequest => {
    const parsedUrl = new URL(interceptedRequest.url())
    const parsedHost = `${parsedUrl.protocol}//${parsedUrl.hostname}`
    if (parsedHost == githubHost ) {
      let body = Buffer.alloc(0)
      if (interceptedRequest.postData()) {
        body = Buffer.from(interceptedRequest.postData())
      }

      const talkbackRequest = {
        url: interceptedRequest.url().substring(githubHost.length),
        method: interceptedRequest.method(),
        headers: interceptedRequest.headers(),
        body: body
      }

      requestHandlerGithub.handle(talkbackRequest)
        .then(r => interceptedRequest.respond(r))
        .catch(error => {
          console.log("Error handling talkback request", error)
          interceptedRequest.abort()
        })
    } else if(parsedHost == weatherHost) {
      let body = Buffer.alloc(0)
      if (interceptedRequest.postData()) {
        body = Buffer.from(interceptedRequest.postData())
      }

      const talkbackRequest = {
        url: interceptedRequest.url().substring(weatherHost.length),
        method: interceptedRequest.method(),
        headers: interceptedRequest.headers(),
        body: body
      }

      requestHandlerWeather.handle(talkbackRequest)
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
  const elementContent = await page.$eval("#github-content", e => e.innerText)
  const weatherContent = await page.$eval("#weather-content", e => e.innerText)
  await browser.close()

  if (elementContent === "ijpiantanida-from-tape" && weatherContent === "380000") {
    console.log("SUCCESS")
  } else {
    console.log("FAILED")
    process.exit(1)
  }

}

start()
  .catch(err => {
    console.log(err)
  })
