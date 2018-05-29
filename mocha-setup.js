const chai = require("chai");
const td = require("testdouble");

chai.use(require('chai-fs'))

global.expect = chai.expect;
global.td = td;