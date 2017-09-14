const fs = require("fs");
const del = require("del");
const rollup = require("rollup");
const babel = require("rollup-plugin-babel");
const pkg = require("../package.json");

let promise = Promise.resolve();

promise = promise.then(() => del(["dist/*"]));

promise = promise.then(() => rollup.rollup({
  input: "src/index.js",
  external: Object.keys(pkg.dependencies),
  plugins: [babel({
    babelrc: false,
    exclude: "node_modules/**",
    runtimeHelpers: true,
    presets: [
      ["env", {
        targets: {
          node: "0.12"
        },
        modules: false
      }]
    ],
    plugins: [
      "external-helpers",
      "transform-object-rest-spread",
      "transform-runtime"
    ]
  })],
}).then(bundle => bundle.write({
  file: "dist/index.js",
  format: "cjs"
})));

promise = promise.then(() => {
  delete pkg.private;
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.nyc;
  fs.writeFileSync("dist/package.json", JSON.stringify(pkg, null, "  "), "utf-8");
  fs.writeFileSync("dist/LICENSE.md", fs.readFileSync("LICENSE.md", "utf-8"), "utf-8");
  fs.writeFileSync("dist/README.md", fs.readFileSync("README.md", "utf-8"), "utf-8");
});

promise.catch(err => console.error(err.stack));