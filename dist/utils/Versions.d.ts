import { ClientOptions } from "../app";
export declare class VersionManager {
    private options;
    constructor(options: ClientOptions);
    getMinecraftVersion(id: string, type?: MinecraftVersionType): Promise<MinecraftVersion | null>;
    static getMinecraftVersions(type?: MinecraftVersionType): Promise<MinecraftVersion[]>;
    getForgeVersion(version: MinecraftVersion | string, type: ForgeVersionType): Promise<ForgeVersion | null>;
    static getForgeVersions(): Promise<ForgeVersion[]>;
}
export declare class ForgeVersion {
    id: number;
    url: string;
    version: string;
    mcversion: string;
    constructor(id: number, version: string, mcversion: string);
}
export declare class MinecraftVersion {
    id: string;
    type: MinecraftVersionType;
    url: string;
    time: Date;
    releaseTime: Date;
    private constructor();
}
export declare type MinecraftVersionType = 'release' | 'snapshot';
export declare type ForgeVersionType = 'latest' | 'recommended';
