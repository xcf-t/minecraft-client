import { ForgeVersion, MinecraftVersion } from "./Versions";
import { ClientOptions } from "../app";
import { MinecraftArtifact } from "./Manifests";
import { AuthenticationResult } from "./Authentication";
export declare class LibraryManager {
    options: ClientOptions;
    version: MinecraftVersion;
    mainClass: string;
    minecraftArguments: string;
    versionType: string;
    assetIndex: string;
    constructor(options: ClientOptions, version: MinecraftVersion);
    installMinecraftLibraries(): Promise<void>;
    installForgeLibraries(version: ForgeVersion): Promise<void>;
    unpackNatives(version: MinecraftVersion): Promise<string>;
    getClasspath(): Promise<string>;
    getLaunchArguments(auth: AuthenticationResult): string[];
}
export declare type MinecraftLibrary = {
    name: string;
    downloads: {
        artifact: MinecraftArtifact;
        classifiers?: {
            "natives-osx"?: MinecraftArtifact;
            "natives-linux"?: MinecraftArtifact;
            "natives-windows"?: MinecraftArtifact;
        };
    };
    extract?: {
        exclude?: [string];
    };
    natives?: {
        linux: "natives-linux";
        osx: "natives-osx";
        windows: "natives-windows";
    };
    rules?: [Rule];
};
declare type Rule = {
    action: 'allow' | 'disallow';
    os?: {
        name: 'osx' | 'linux' | 'windows';
    };
};
export {};
