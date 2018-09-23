import { MinecraftVersion, VersionManager } from "./utils/Versions";
import { LibraryManager } from "./utils/Libraries";
export declare class MinecraftClient {
    version: MinecraftVersion;
    options: ClientOptions;
    versionManager: VersionManager;
    libraryManager: LibraryManager;
    constructor(version: MinecraftVersion, options?: ClientOptions, versionManager?: VersionManager, libraryManager?: LibraryManager);
    static getClient(version: string | MinecraftVersion, options?: ClientOptions): Promise<MinecraftClient | null>;
    install(): Promise<void>;
}
export declare type ClientOptions = {
    gameFolder?: string;
    javaExecutable?: string;
};
