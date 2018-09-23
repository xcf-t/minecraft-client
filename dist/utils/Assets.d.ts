import { MinecraftVersion } from "./Versions";
import { ClientOptions } from "../app";
export declare class AssetManager {
    options: ClientOptions;
    version: MinecraftVersion;
    constructor(options: ClientOptions, version: MinecraftVersion);
    install(): Promise<void>;
    private static getPath;
}
