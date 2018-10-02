import { MinecraftVersion } from "./Versions";
import { ClientOptions } from "../app";
import { InstallationProgress } from "./InstallationProgress";
export declare class AssetManager {
    options: ClientOptions;
    version: MinecraftVersion;
    constructor(options: ClientOptions, version: MinecraftVersion);
    install(progress: InstallationProgress): Promise<void>;
    private static getPath;
}
