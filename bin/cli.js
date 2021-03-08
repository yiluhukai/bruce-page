#!/usr/bin/env node

//
process.argv.push("-f");
//process.argv.push(require.resolve(".."));
process.argv.push(require.resolve("../lib/index"));

process.argv.push("--cwd");
process.argv.push(process.cwd());
// 调用gulp
require("gulp/bin/gulp");
