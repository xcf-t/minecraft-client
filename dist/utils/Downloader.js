"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch = require("node-fetch");
const unzip = require("unzipper");
const mkdir = require("mkdirp");
const mz_1 = require("mz");
const path = require("path");
class Downloader {
    static async getFile(url) {
        let res = await fetch.default(url);
        return await res.buffer();
    }
    static async download(url, destination) {
        let res = await fetch.default(url);
        await new Promise(r => mkdir(path.join(destination, '..'), r));
        await mz_1.fs.writeFile(destination, await res.buffer());
    }
    static async existsOrDownload(url, destination) {
        if (!await mz_1.fs.exists(destination))
            return await Downloader.download(url, destination);
    }
    static async checkOrDownload(url, sha1, destination) {
        let result = true;
        if (await mz_1.fs.exists(destination)) {
            let hash = mz_1.crypto.createHash('sha1');
            hash.update(await mz_1.fs.readFile(destination));
            if (Array.isArray(sha1)) {
                result = sha1.indexOf(hash.digest().toString('hex')) === -1;
            }
            else
                result = hash.digest().toString('hex') !== sha1;
        }
        if (result)
            return await this.download(url, destination);
    }
    static async unpack(file, destination) {
        let input = mz_1.fs.createReadStream(file);
        let parse = input.pipe(unzip.Extract({
            path: destination
        }));
        await new Promise((resolve, reject) => {
            parse.on('close', resolve);
            parse.on('error', reject);
        });
    }
}
exports.default = Downloader;
//# sourceMappingURL=Downloader.js.map