"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mkdir = require("mkdirp");
const path = require("path");
const os = require("os");
const mz_1 = require("mz");
async function tree(dir, filePath = "") {
    let result = [];
    let files = await mz_1.fs.readdir(dir);
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let stat = await mz_1.fs.stat(path.join(dir, file));
        if (stat.isDirectory()) {
            result.push(...await tree(path.join(dir, file), path.join(filePath, file)));
        }
        else if (stat.isFile()) {
            result.push(path.join(filePath, path.basename(file)));
        }
    }
    return result;
}
exports.tree = tree;
function createTempDir() {
    let dir = path.join(os.tmpdir(), uuid());
    mkdir(dir);
    return dir;
}
exports.createTempDir = createTempDir;
function uuid() {
    return Math.round(Math.random() * 1e14).toString(16).toUpperCase();
}
//# sourceMappingURL=TempHelper.js.map