var talkback
if (process.env.USE_NPM) {
  talkback = require("talkback")
  console.log("Using NPM talkback")
} else {
  talkback = require("../../dist")
}

function isControlPlane(req) {
  return !!req.url.match(/\/__talkback__/)
}

function recordMode(req) {
  return process.env.RECORD === "true" ? talkback.Options.RecordMode.NEW : talkback.Options.RecordMode.DISABLED
}

var cartNumber = 0

function isCartRequest(req) {
  return req.url.match(/\/carts\/[a-zA-Z-0-9]+/)
}

function urlMatcher(tape, req) {
  console.log("BOO " + req.url)
  if(tape.req.url !== req.url) {
    return false;
  }

  if(isCartRequest(req)) {
    console.log("is cart request " + tape.meta.tag)
    return tape.meta.tag === "cart-items-" + cartNumber
  } else {
    console.log("Not cart request " + req.url)
  }

  return true;
}

function requestDecorator(req, context) {
  if(req.method == 'PUT' && isCartRequest(req)) {
    cartNumber++;
  }
  return req
}

function tapeDecorator(tape, context) {
  if(isCartRequest(tape.req) && tape.req.method == 'GET') {
    tape.meta.tag = 'cart-items-' + cartNumber
  }
  return tape
}

function controlPlaneRequestHandler(req) {
  cartNumber = 0
}

console.log("WAT")

var server = talkback({
  host: "http://fake-server.localhost",
  path: __dirname + "/tapes",
  record: recordMode,
  fallbackMode: fallbackMode,
  debug: true,
  name: "Example - Stateful",
  ignoreHeaders: ["user-agent"],
  urlMatcher: urlMatcher,
  tapeDecorator: tapeDecorator,
  requestDecorator: requestDecorator,
  controlPlane: {
    requestHandler: controlPlaneRequestHandler
  }
})

server.start()
