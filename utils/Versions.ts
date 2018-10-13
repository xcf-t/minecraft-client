import {ClientOptions} from "../app";
import {Endpoints} from "./Constants";
import * as fetch from "node-fetch";
import * as mkdir from 'mkdirp';
import * as path from "path";
import {fs} from 'mz';

import {MinecraftVersionManifest, ForgeVersionManifest} from './Manifests';
import {MinecraftLibraryManifest, ForgeLibraryManifest} from './Manifests';
import {MinecraftVersionType, ForgeVersionType}         from './Manifests';
import {MinecraftAssetIndex}                            from './Manifests';

import Downloader from "./Downloader";

export class ForgeVersion {

    public id: number;
    public version: string;
    public mcversion: string;
    public universal: string;
    public installer: string;

    constructor(id: number, version: string, mcversion: string) {
        this.id = id;
        this.version = version;
        if(mcversion === '1.7.10') //Hacky solution because forge is inconsistent
            version += '-' + mcversion;
        this.installer = Endpoints.FORGE_MAVEN_ARTIFACT + `${mcversion}-${version}/forge-${mcversion}-${version}-installer.jar`;
        this.universal = Endpoints.FORGE_MAVEN_ARTIFACT + `${mcversion}-${version}/forge-${mcversion}-${version}-universal.jar`;
        this.mcversion = mcversion;
    }

    public static getCustomVersion(build: number, version: string, mcversion: MinecraftVersion | string): ForgeVersion {
        let mc: string;
        if(typeof mcversion === 'string')
            mc = <string>mcversion;
        else
            mc = <string>(<MinecraftVersion>mcversion).id;
        return new ForgeVersion(build, version, mc);
    }

    public static async getPromotedVersion(version: MinecraftVersion | string, type: ForgeVersionType): Promise<ForgeVersion | null> {
        let res: fetch.Response = await fetch.default(Endpoints.FORGE_VERSION_MANIFEST);
        let data: Buffer = await res.buffer();
        let manifest: ForgeVersionManifest = JSON.parse(data.toString());

        let id: string;
        if(typeof version === 'string')
            id = <string>version;
        else
            id = <string>(<MinecraftVersion>version).id;

        let buildNumber: number = manifest.promos[`${id}-${type}`];
        let build: ForgeBuild = manifest.number[buildNumber];

        return new ForgeVersion(build.build, build.version, build.mcversion);
    }

    public static async getVersions(): Promise<ForgeVersion[]> {
        let res: fetch.Response = await fetch.default(Endpoints.FORGE_VERSION_MANIFEST);
        let data: Buffer = await res.buffer();
        let manifest: ForgeVersionManifest = JSON.parse(data.toString());
        let keys: string[] = Object.keys(manifest.number);
        let result: ForgeVersion[] = [];
        for(let i = 0; i < keys.length; i++) {
            let build: ForgeBuild = manifest.number[keys[i]];
            result.push(new ForgeVersion(build.build, build.version, build.mcversion));
        }
        return result;
    }


}

export class MinecraftVersion {

    public id: string;
    public type: MinecraftVersionType;
    public url: string;
    public time: Date;
    public releaseTime: Date;

    public cache: string;

    constructor(id: string, type: MinecraftVersionType, url: string, time: Date, releaseTime: Date, cache?: string) {
        this.id = id;
        this.type = type;
        this.url = url;
        this.time = time;
        this.releaseTime = releaseTime;
        this.cache = cache;
    }

    public async getLibraryManifest(): Promise<MinecraftLibraryManifest> {
        if(this.cache) {
            return JSON.parse(this.cache);
        } else {
            let res: fetch.Response = await fetch.default(this.url);
            return await res.json();
        }
    }

    public async getAssetIndex(options: ClientOptions): Promise<MinecraftAssetIndex> {
        let libraryManifest: MinecraftLibraryManifest = await this.getLibraryManifest();
        let assetVersion: string = libraryManifest.assets;
        let dest: string = path.join(options.gameDir, 'assets', 'indexes', assetVersion + '.json');
        if(await fs.exists(dest)) {
            let data: Buffer = await fs.readFile(dest);
            let index: MinecraftAssetIndex = JSON.parse(data.toString());
            return index;
        } else {
            let res: fetch.Response = await fetch.default(libraryManifest.assetIndex.url);
            let data: string = await res.text();
            await new Promise(r => mkdir(path.join(dest, '..'), r));
            await fs.writeFile(dest, data);
            return JSON.parse(data);
        }
    }


    public static async getVersion(id: string, options: ClientOptions, type?: MinecraftVersionType): Promise<MinecraftVersion | null> {
        let mfLocation: string = path.join(options.gameDir, 'versions', id, `${id}.json`);
        if(await fs.exists(mfLocation)) {
            let data: Buffer = await fs.readFile(mfLocation);
            let mf: MinecraftLibraryManifest = JSON.parse(data.toString());

            return new MinecraftVersion(mf.id, "unknown", null, new Date(), new Date(), data.toString());
        }
        let versions: MinecraftVersion[] = await this.getVersions(type);

        for(let i = 0; i < versions.length; i++)
            if(versions[i].id == id) {
                let version: MinecraftVersion = versions[i];

                let versionFolder: string = path.join(options.gameDir, 'versions', version.id);

                await Downloader.existsOrDownload(version.url, path.join(versionFolder, version.id + ".json"));

                return new MinecraftVersion(version.id, version.type, version.url, version.time, version.releaseTime, version.cache);
            }

        return null;
    }

    public static async getVersions(type?: MinecraftVersionType): Promise<MinecraftVersion[]> {
        let res: fetch.Response = await fetch.default(Endpoints.VERSION_MANIFEST);
        let data: Buffer = await res.buffer();
        let manifest: MinecraftVersionManifest = JSON.parse(data.toString());
        if(!type)
            return manifest.versions;
        else {
            let result: MinecraftVersion[] = [];
            for(let i = 0; i < manifest.versions.length; i++) {
                let version = manifest.versions[i];
                if(version.type === type)
                    result.push(version);
            }
            return result;
        }
    }

}


declare type ForgeBuild = {
    branch: any,
    build: number,
    files: [[string]],
    mcversion: string,
    modified: number,
    version: string
}