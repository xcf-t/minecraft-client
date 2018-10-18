import {ForgeVersion, MinecraftVersion} from "./utils/Versions";

import * as path from 'path';

import Downloader from "./utils/Downloader";

import {LibraryManager} from "./utils/Libraries";
import {AssetManager}   from "./utils/Assets";

import {child_process, fs} from 'mz';
import * as mkdirp from 'mkdirp';

import {Authentication, AuthenticationResult} from "./utils/Authentication";
import {ForgeVersionDescription, ForgeVersionType} from "./utils/Manifests";
import {CustomForgeMod, CurseForgeMod, ForgeMod} from "./utils/Mods";
import {InstallationProgress} from "./utils/InstallationProgress";

export {Authentication, AuthenticationResult} from "./utils/Authentication";
export {ForgeVersion, MinecraftVersion} from "./utils/Versions";
export {InstallationProgress} from "./utils/InstallationProgress";
export {CurseForgeMod, CustomForgeMod, ForgeMod} from "./utils/Mods";
export {ForgeVersionDescription, ForgeVersionType} from "./utils/Manifests";

export class MinecraftClient {

    version: MinecraftVersion;
    options: ClientOptions;
    forge: ForgeVersion;

    progress: InstallationProgress;

    libraryManager: LibraryManager;
    assetManager: AssetManager;

    nativeDir: string;

    private constructor(version: MinecraftVersion, forge?: ForgeVersion, options: ClientOptions = MinecraftClient.defaultConfig, progress?: InstallationProgress) {
        for(let i in MinecraftClient.defaultConfig)
            if(!options[i])
                options[i] = MinecraftClient.defaultConfig[i];

        this.options = options;

        this.version = version;
        this.forge = forge;

        this.libraryManager = new LibraryManager(options, version);
        this.assetManager   = new AssetManager(options, version);

        this.progress = progress || InstallationProgress.callback();
    }

    private static readonly defaultConfig: ClientOptions = {
        javaExecutable: 'java'
    };

    public static getMinecraftClient(version: string | MinecraftVersion, options: ClientOptions, progress?: InstallationProgress): Promise<MinecraftClient | null> {
        return this.getClient(version, null, options, progress);
    }

    public static getForgeClient(version: string | MinecraftVersion, forge: ForgeVersionType | ForgeVersionDescription, options: ClientOptions, progress?: InstallationProgress): Promise<MinecraftClient | null> {
        return this.getClient(version, forge, options, progress);
    }

    public static async getClient(version: string | MinecraftVersion, forge: ForgeVersionType | ForgeVersionDescription, options: ClientOptions, progress?: InstallationProgress): Promise<MinecraftClient | null> {
        let mcVersion: MinecraftVersion;

        if(typeof version === 'string') {
            mcVersion = <MinecraftVersion>await MinecraftVersion.getVersion(<string>version, options);
        } else {
            mcVersion = <MinecraftVersion>version;
        }

        let forgeVersion: ForgeVersion;
        if(forge) {
            if(forge === "recommended" || forge === "latest")
                forgeVersion = <ForgeVersion>await ForgeVersion.getPromotedVersion(mcVersion, forge);
            else {
                let version: string = forge; //14.23.4.2709
                let build: number; // [14, 23, 4, 2709].reverse() => [2709,4,23,14][0] => 2709

                if(version.indexOf('.') === -1)
                    return null; // failsafe?

                build = parseInt(version.split('\.').reverse()[0]);

                forgeVersion = await ForgeVersion.getCustomVersion(build, version, mcVersion);
            }
        }

        if(!mcVersion)
            return null;

        return new MinecraftClient(mcVersion, forgeVersion, options, progress);
    }

    public async checkInstallation(): Promise<void> {
        this.progress.step("Installing Libraries");
        await this.libraryManager.installMinecraftLibraries(this.progress);
        if(this.forge) {
            this.progress.step("Installing Forge Libraries");
            await this.libraryManager.installForgeLibraries(this.forge, this.progress);
        }
        this.progress.step("Installing Assets");
        await this.assetManager.install(this.progress);
    }

    public async checkMods(mods: ForgeMod[], exclusive: boolean): Promise<void> {
        this.progress.step("Installing Mods");

        mkdirp(path.join(this.options.gameDir, 'mods'));

        let files: string[];
        if(exclusive && await fs.exists(path.join(this.options.gameDir, 'mods')))
            files = await fs.readdir(path.join(this.options.gameDir, 'mods'));
        else
            files = [];

        files = files.filter(value => value.indexOf('.jar') !== -1);

        for(let i = 0; i < mods.length; i++) {
            let mod: ForgeMod = mods[i];

            let id: string = mod.name.replace(/\s/g, '_');

            this.progress.call(i/mods.length);

            let file: string = path.join(this.options.gameDir, 'mods', id + '.jar');

            if(exclusive) {
                let i: number = files.indexOf(id + '.jar');
                if(i !== -1)
                    files.splice(i, 1);
            }

            if(mod.sha1)
                await Downloader.checkOrDownload(mod.url, mod.sha1, file);
            else
                await Downloader.existsOrDownload(mod.url, file);
        }

        if(exclusive) {
            let task: Promise<void>[] = [];
            for(let i = 0; i < files.length; i++)
                task.push(fs.unlink(path.join(this.options.gameDir, 'mods', files[i])));

            await Promise.all(task);
        }

        this.progress.call(1);
    }

    public async launch(auth: AuthenticationResult, redirectOutput?: boolean, javaArguments?: string[]): Promise<child_process.ChildProcess> {
        this.nativeDir = await this.libraryManager.unpackNatives(this.version);
        let args: string[] = [];

        if(javaArguments)
            args.push(...(javaArguments));

        args.push(`-Djava.library.path=${this.nativeDir}`);
        args.push('-cp');
        let classpath: string = this.libraryManager.getClasspath();
        args.push(classpath);

        args.push(...this.libraryManager.getLaunchArguments(auth));

        let cp: child_process.ChildProcess = child_process.spawn(this.options.javaExecutable, args, {
            cwd: this.options.gameDir
        });
        if(redirectOutput) {
            cp.stdout.pipe(process.stdout);
            cp.stderr.pipe(process.stderr);
        }
        return cp;
    }

}

export declare type ClientOptions = {
    gameDir?: string,
    javaExecutable?: string
}