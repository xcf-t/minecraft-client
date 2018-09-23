import {MinecraftVersion} from "./Versions";
import {ClientOptions} from "../app";
import {MinecraftAsset, MinecraftAssetIndex} from "./Manifests";
import Downloader from "./Downloader";
import {Endpoints} from "./Constants";

import * as mkdir from 'mkdirp';
import * as path from 'path';

export class AssetManager {

    options: ClientOptions;
    version: MinecraftVersion;

    constructor(options: ClientOptions, version: MinecraftVersion) {
        this.options = options;
        this.version = version;
    }

    public async install(): Promise<void> {
        let index: MinecraftAssetIndex = await this.version.getAssetIndex(this.options);
        let tasks: Promise<void>[] = [];
        let keys: string[] = Object.keys(index.objects);
        for(let i = 0; i < keys.length; i++) {
            let asset: MinecraftAsset = index.objects[keys[i]];
            let dest: string = path.join(
                this.options.gameDir,
                'assets',
                'objects',
                AssetManager.getPath(asset.hash)
            );
            mkdir(path.join(dest, '..'));
            tasks.push(Downloader.checkOrDownload(
                Endpoints.MINECRAFT_ASSET_SERVER + AssetManager.getPath(asset.hash),
                asset.hash,
                dest
            ));
        }
        await Promise.all(tasks);
    }

    private static getPath(hash: string): string {
        return hash.substring(0, 2) + '/' + hash;
    }

}