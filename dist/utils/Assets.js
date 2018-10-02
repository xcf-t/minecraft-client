"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Downloader_1 = require("./Downloader");
const Constants_1 = require("./Constants");
const mkdir = require("mkdirp");
const path = require("path");
class AssetManager {
    constructor(options, version) {
        this.options = options;
        this.version = version;
    }
    async install(progress) {
        let index = await this.version.getAssetIndex(this.options);
        let keys = Object.keys(index.objects);
        for (let i = 0; i < keys.length; i++) {
            let asset = index.objects[keys[i]];
            progress.call(i / keys.length);
            let dest = path.join(this.options.gameDir, 'assets', 'objects', AssetManager.getPath(asset.hash));
            mkdir(path.join(dest, '..'));
            await Downloader_1.default.checkOrDownload(Constants_1.Endpoints.MINECRAFT_ASSET_SERVER + AssetManager.getPath(asset.hash), asset.hash, dest);
        }
        progress.call(1);
    }
    static getPath(hash) {
        return hash.substring(0, 2) + '/' + hash;
    }
}
exports.AssetManager = AssetManager;
//# sourceMappingURL=Assets.js.map