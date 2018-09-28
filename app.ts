import {ForgeVersion, MinecraftVersion} from "./utils/Versions";

import * as path from 'path';
import Downloader from "./utils/Downloader";

import {LibraryManager} from "./utils/Libraries";
import {AssetManager}   from "./utils/Assets";

import {child_process} from 'mz';

import {Authentication, AuthenticationResult} from "./utils/Authentication";
import {ForgeVersionDescription, ForgeVersionType} from "./utils/Manifests";
import {CustomForgeMod, CurseForgeMod, ForgeMod} from "./utils/Mods";

export {Authentication} from "./utils/Authentication";
export {ForgeVersion, MinecraftVersion} from "./utils/Versions";
export {CurseForgeMod, CustomForgeMod, ForgeMod} from "./utils/Mods";

export class MinecraftClient {

    version: MinecraftVersion;
    options: ClientOptions;
    forge: ForgeVersion;

    libraryManager: LibraryManager;
    assetManager: AssetManager;

    nativeDir: string;

    private constructor(version: MinecraftVersion, forge?: ForgeVersion, options: ClientOptions = MinecraftClient.defaultConfig) {
        for(let i in MinecraftClient.defaultConfig)
            if(!options[i])
                options[i] = MinecraftClient.defaultConfig[i];

        this.options = options;

        this.version = version;
        this.forge = forge;

        this.libraryManager = new LibraryManager(options, version);
        this.assetManager   = new AssetManager(options, version);
    }

    private static readonly defaultConfig: ClientOptions = {
        javaArguments: [],
        javaExecutable: 'java'
    };

    public static getMinecraftClient(version: string | MinecraftVersion, options: ClientOptions): Promise<MinecraftClient | null> {
        return this.getClient(version, null, options);
    }

    public static getForgeClient(version: string | MinecraftVersion, forge: ForgeVersionType | ForgeVersionDescription, options: ClientOptions): Promise<MinecraftClient | null> {
        return this.getClient(version, forge, options);
    }

    public static async getClient(version: string | MinecraftVersion, forge: ForgeVersionType | ForgeVersionDescription, options: ClientOptions): Promise<MinecraftClient | null> {
        let mcVersion: MinecraftVersion;

        if(typeof version === 'string') {
            mcVersion = <MinecraftVersion>await MinecraftVersion.getVersion(<string>version, options);
        } else {
            mcVersion = <MinecraftVersion>version;
        }

        let forgeVersion: ForgeVersion;
        if(forge) {
            if(typeof forge === 'string') {
                forgeVersion = <ForgeVersion>await ForgeVersion.getPromotedVersion(mcVersion, <ForgeVersionType>forge);
            } else {
                forgeVersion = ForgeVersion.getCustomVersion(forge.build, forge.version, mcVersion);
            }
        }

        if(!mcVersion)
            return null;

        return new MinecraftClient(mcVersion, forgeVersion, options);
    }

    public async checkInstallation(): Promise<void> {
        await this.libraryManager.installMinecraftLibraries();
        if(this.forge)
            await this.libraryManager.installForgeLibraries(this.forge);
        await this.assetManager.install();
    }

    public async checkMods(...mods: ForgeMod[]): Promise<void> {
        for(let i = 0; i < mods.length; i++) {
            let mod: ForgeMod = mods[i];

            let file: string = path.join(this.options.gameDir, 'mods', `${mod.name.replace(/\s/g, '_')}.jar`);

            if(mod.sha1)
                await Downloader.checkOrDownload(mod.url, mod.sha1, file);
            else
                await Downloader.existsOrDownload(mod.url, file);
        }
    }

    public async launch(auth: AuthenticationResult): Promise<child_process.ChildProcess> {
        this.nativeDir = await this.libraryManager.unpackNatives(this.version);
        let args: string[] = [];
        args.push(`-Djava.library.path=${this.nativeDir}`);
        args.push('-cp');
        let classpath: string = await this.libraryManager.getClasspath();
        args.push(classpath);
        args.push(...(this.options.javaArguments || []));
        args.push(...this.libraryManager.getLaunchArguments(auth));

        let cp: child_process.ChildProcess = child_process.spawn(this.options.javaExecutable, args, {
            cwd: this.options.gameDir
        });
        cp.stdout.pipe(process.stdout);
        cp.stderr.pipe(process.stderr);
        return cp;
    }

}

export declare type ClientOptions = {
    gameDir?: string,
    javaExecutable?: string,
    javaArguments?: string[],
}