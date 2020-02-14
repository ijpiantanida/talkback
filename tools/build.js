const fs = require("fs")
const del = require("del")
const pkg = require("../package.json")

const exec = require("child_process").exec

let promise = Promise.resolve()
  .then(() => del(["dist/*"]))
  .then(() => new Promise((resolve) => {
    exec("yarn run tsc", function(error, stdout, stderr) {
      resolve()
    })
  }))
  .then(() => {
    delete pkg.private
    delete pkg.devDependencies
    delete pkg.scripts
    delete pkg.nyc
    fs.writeFileSync("dist/package.json", JSON.stringify(pkg, null, "  "), "utf-8")
    fs.writeFileSync("dist/CHANGELOG.md", fs.readFileSync("CHANGELOG.md", "utf-8"), "utf-8")
    fs.writeFileSync("dist/LICENSE.md", fs.readFileSync("LICENSE.md", "utf-8"), "utf-8")
    fs.writeFileSync("dist/README.md", fs.readFileSync("README.md", "utf-8"), "utf-8")

  })

promise.catch(err => console.error(err.stack))
