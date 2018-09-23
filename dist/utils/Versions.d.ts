import { ClientOptions } from "../app";
import { MinecraftLibraryManifest } from './Manifests';
import { MinecraftVersionType, ForgeVersionType } from './Manifests';
import { MinecraftAssetIndex } from './Manifests';
export declare class ForgeVersion {
    id: number;
    version: string;
    mcversion: string;
    universal: string;
    installer: string;
    constructor(id: number, version: string, mcversion: string);
    static getCustomVersion(build: number, version: string, mcversion: MinecraftVersion | string): ForgeVersion;
    static getPromotedVersion(version: MinecraftVersion | string, type: ForgeVersionType): Promise<ForgeVersion | null>;
    static getVersions(): Promise<ForgeVersion[]>;
}
export declare class MinecraftVersion {
    id: string;
    type: MinecraftVersionType;
    url: string;
    time: Date;
    releaseTime: Date;
    cache: string;
    constructor(id: string, type: MinecraftVersionType, url: string, time: Date, releaseTime: Date, cache?: string);
    getLibraryManifest(): Promise<MinecraftLibraryManifest>;
    getAssetIndex(options: ClientOptions): Promise<MinecraftAssetIndex>;
    static getVersion(id: string, options: ClientOptions, type?: MinecraftVersionType): Promise<MinecraftVersion | null>;
    static getVersions(type?: MinecraftVersionType): Promise<MinecraftVersion[]>;
}
