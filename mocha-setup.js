require("tsx/cjs")
require("source-map-support/register")
const chai = require("chai");
const td = require("testdouble");

global.expect = chai.expect;
global.td = td;
