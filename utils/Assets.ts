import {MinecraftVersion} from "./Versions";
import {ClientOptions} from "../app";
import {MinecraftAsset, MinecraftAssetIndex} from "./Manifests";
import Downloader from "./Downloader";
import {Endpoints} from "./Constants";

import * as mkdir from 'mkdirp';
import * as path from 'path';
import {InstallationProgress} from "./InstallationProgress";

export class AssetManager {

    options: ClientOptions;
    version: MinecraftVersion;

    constructor(options: ClientOptions, version: MinecraftVersion) {
        this.options = options;
        this.version = version;
    }

    public async install(progress: InstallationProgress): Promise<void> {
        let index: MinecraftAssetIndex = await this.version.getAssetIndex(this.options);
        let keys: string[] = Object.keys(index.objects);
        for(let i = 0; i < keys.length; i++) {
            let asset: MinecraftAsset = index.objects[keys[i]];
            progress.call(i/keys.length);
            let dest: string = path.join(
                this.options.gameDir,
                'assets',
                'objects',
                AssetManager.getPath(asset.hash)
            );
            mkdir(path.join(dest, '..'));
            await Downloader.checkOrDownload(
                Endpoints.MINECRAFT_ASSET_SERVER + AssetManager.getPath(asset.hash),
                asset.hash,
                dest
            );
        }
        progress.call(1);
    }

    private static getPath(hash: string): string {
        return hash.substring(0, 2) + '/' + hash;
    }

}