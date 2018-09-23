"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const download = require("download"); //TODO: Replace with fetch
const Constants_1 = require("./Constants");
const fetch = require("node-fetch");
const mkdir = require("mkdirp");
const path = require("path");
const mz_1 = require("mz");
const Downloader_1 = require("./Downloader");
class ForgeVersion {
    constructor(id, version, mcversion) {
        this.id = id;
        this.installer = Constants_1.Endpoints.FORGE_MAVEN_ARTIFACT + `${mcversion}-${version}/forge-${mcversion}-${version}-installer.jar`;
        this.universal = Constants_1.Endpoints.FORGE_MAVEN_ARTIFACT + `${mcversion}-${version}/forge-${mcversion}-${version}-universal.jar`;
        this.version = version;
        this.mcversion = mcversion;
    }
    static getCustomVersion(build, version, mcversion) {
        let mc;
        if (typeof mcversion === 'string')
            mc = mcversion;
        else
            mc = mcversion.id;
        return new ForgeVersion(build, version, mc);
    }
    static async getPromotedVersion(version, type) {
        let data = await download(Constants_1.Endpoints.FORGE_VERSION_MANIFEST);
        let manifest = JSON.parse(data.toString());
        let id;
        if (typeof version === 'string')
            id = version;
        else
            id = version.id;
        let buildNumber = manifest.promos[`${id}-${type}`];
        let build = manifest.number[buildNumber];
        console.log(build);
        return new ForgeVersion(build.build, build.version, build.mcversion);
    }
    static async getVersions() {
        let data = await download(Constants_1.Endpoints.FORGE_VERSION_MANIFEST);
        let manifest = JSON.parse(data.toString());
        let keys = Object.keys(manifest.number);
        let result = [];
        for (let i = 0; i < keys.length; i++) {
            let build = manifest.number[keys[i]];
            result.push(new ForgeVersion(build.build, build.version, build.mcversion));
        }
        return result;
    }
}
exports.ForgeVersion = ForgeVersion;
class MinecraftVersion {
    constructor(id, type, url, time, releaseTime, cache) {
        this.id = id;
        this.type = type;
        this.url = url;
        this.time = time;
        this.releaseTime = releaseTime;
        this.cache = cache;
    }
    async getLibraryManifest() {
        if (this.cache) {
            return JSON.parse(this.cache);
        }
        else {
            let res = await fetch.default(this.url);
            return await res.json();
        }
    }
    async getAssetIndex(options) {
        let libraryManifest = await this.getLibraryManifest();
        let assetVersion = libraryManifest.assets;
        let dest = path.join(options.gameDir, 'assets', 'indexes', assetVersion + '.json');
        if (await mz_1.fs.exists(dest)) {
            let data = await mz_1.fs.readFile(dest);
            let index = JSON.parse(data.toString());
            return index;
        }
        else {
            let res = await fetch.default(libraryManifest.assetIndex.url);
            let data = await res.text();
            await new Promise(r => mkdir(path.join(dest, '..'), r));
            await mz_1.fs.writeFile(dest, data);
            return JSON.parse(data);
        }
    }
    static async getVersion(id, options, type) {
        let mfLocation = path.join(options.gameDir, 'versions', id, `${id}.json`);
        if (await mz_1.fs.exists(mfLocation)) {
            let data = await mz_1.fs.readFile(mfLocation);
            let mf = JSON.parse(data.toString());
            return new MinecraftVersion(mf.id, "unknown", null, new Date(), new Date(), data.toString());
        }
        let versions = await this.getVersions(type);
        for (let i = 0; i < versions.length; i++)
            if (versions[i].id == id) {
                let version = versions[i];
                let versionFolder = path.join(options.gameDir, 'versions', version.id);
                await Downloader_1.default.existsOrDownload(version.url, path.join(versionFolder, version.id + ".json"));
                return new MinecraftVersion(version.id, version.type, version.url, version.time, version.releaseTime, version.cache);
            }
        return null;
    }
    static async getVersions(type) {
        let data = await download(Constants_1.Endpoints.VERSION_MANIFEST);
        let manifest = JSON.parse(data.toString());
        if (!type)
            return manifest.versions;
        else {
            let result = [];
            for (let i = 0; i < manifest.versions.length; i++) {
                let version = manifest.versions[i];
                if (version.type === type)
                    result.push(version);
            }
            return result;
        }
    }
}
exports.MinecraftVersion = MinecraftVersion;
//# sourceMappingURL=Versions.js.map