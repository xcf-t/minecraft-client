import { ForgeVersion, MinecraftVersion } from "./Versions";
import { ClientOptions } from "../app";
export declare class LibraryManager {
    options: ClientOptions;
    version: MinecraftVersion;
    constructor(version: MinecraftVersion, options: ClientOptions);
    installMinecraftLibraries(version: MinecraftVersion): Promise<void>;
    installForgeLibraries(version: ForgeVersion): Promise<void>;
}
export declare type Library = {
    name: string;
    downloads: {
        artifact: Artifact;
        classifiers?: {
            "natives-osx"?: Artifact;
            "natives-linux"?: Artifact;
            "natives-windows"?: Artifact;
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
declare type Artifact = {
    path?: string;
    sha1: string;
    size: number;
    url: string;
};
export declare type ForgeLibraryManifest = {
    install: {
        profileName: string;
        target: string;
        path: string;
        version: string;
        filePath: string;
        minecraft: string;
        mirrorList: string;
        logo: string;
        welcome: string;
        modlist: string;
    };
    versionInfo: {
        id: string;
        time: Date;
        releaseTime: Date;
        type: string;
        minecraftArguments: string;
        mainClass: string;
        inheritsFrom: string;
        jar: string;
        logging: object;
        libraries: ForgeManifestLibrary[];
    };
    optionals: ForgeManifestLibrary[];
};
declare type ForgeManifestLibrary = {
    name: string;
    url?: string;
    checksums?: [string];
    serverreq?: boolean;
    clientreq?: boolean;
};
export declare type Manifest = {
    assetIndex: Artifact;
    assets: string;
    downloads: {
        client: Artifact;
        server: Artifact;
    };
    id: string;
    libraries: [Library];
    mainClass: string;
    minecraftArguments: string;
    minimumLauncherVersion: number;
    releaseTime: Date;
    time: Date;
    type: 'release' | 'snapshot';
};
declare type Rule = {
    action: 'allow' | 'disallow';
    os?: {
        name: 'osx' | 'linux' | 'windows';
    };
};
export declare function getManifest(version: MinecraftVersion, options: ClientOptions): Promise<Manifest>;
export {};
