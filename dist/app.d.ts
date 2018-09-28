/// <reference types="node" />
import { ForgeVersion, MinecraftVersion } from "./utils/Versions";
import { LibraryManager } from "./utils/Libraries";
import { AssetManager } from "./utils/Assets";
import { child_process } from 'mz';
export { Authentication } from "./utils/Authentication";
import { AuthenticationResult } from "./utils/Authentication";
import { ForgeVersionDescription, ForgeVersionType } from "./utils/Manifests";
import { ForgeMod } from "./utils/Mods";
export declare class MinecraftClient {
    version: MinecraftVersion;
    options: ClientOptions;
    forge: ForgeVersion;
    libraryManager: LibraryManager;
    assetManager: AssetManager;
    nativeDir: string;
    private constructor();
    private static readonly defaultConfig;
    static getMinecraftClient(version: string | MinecraftVersion, options: ClientOptions): Promise<MinecraftClient | null>;
    static getForgeClient(version: string | MinecraftVersion, forge: ForgeVersionType | ForgeVersionDescription, options: ClientOptions): Promise<MinecraftClient | null>;
    static getClient(version: string | MinecraftVersion, forge: ForgeVersionType | ForgeVersionDescription, options: ClientOptions): Promise<MinecraftClient | null>;
    checkInstallation(): Promise<void>;
    checkMods(...mods: ForgeMod[]): Promise<void>;
    launch(auth: AuthenticationResult): Promise<child_process.ChildProcess>;
}
export declare type ClientOptions = {
    gameDir?: string;
    javaExecutable?: string;
    javaArguments?: string[];
};
