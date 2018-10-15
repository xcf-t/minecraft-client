"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Versions_1 = require("./utils/Versions");
const path = require("path");
const Downloader_1 = require("./utils/Downloader");
const Libraries_1 = require("./utils/Libraries");
const Assets_1 = require("./utils/Assets");
const mz_1 = require("mz");
const mkdirp = require("mkdirp");
const InstallationProgress_1 = require("./utils/InstallationProgress");
var Authentication_1 = require("./utils/Authentication");
exports.Authentication = Authentication_1.Authentication;
var Versions_2 = require("./utils/Versions");
exports.ForgeVersion = Versions_2.ForgeVersion;
exports.MinecraftVersion = Versions_2.MinecraftVersion;
var InstallationProgress_2 = require("./utils/InstallationProgress");
exports.InstallationProgress = InstallationProgress_2.InstallationProgress;
var Mods_1 = require("./utils/Mods");
exports.CurseForgeMod = Mods_1.CurseForgeMod;
exports.CustomForgeMod = Mods_1.CustomForgeMod;
class MinecraftClient {
    constructor(version, forge, options = MinecraftClient.defaultConfig, progress) {
        for (let i in MinecraftClient.defaultConfig)
            if (!options[i])
                options[i] = MinecraftClient.defaultConfig[i];
        this.options = options;
        this.version = version;
        this.forge = forge;
        this.libraryManager = new Libraries_1.LibraryManager(options, version);
        this.assetManager = new Assets_1.AssetManager(options, version);
        this.progress = progress || InstallationProgress_1.InstallationProgress.callback();
    }
    static getMinecraftClient(version, options, progress) {
        return this.getClient(version, null, options, progress);
    }
    static getForgeClient(version, forge, options, progress) {
        return this.getClient(version, forge, options, progress);
    }
    static async getClient(version, forge, options, progress) {
        let mcVersion;
        if (typeof version === 'string') {
            mcVersion = await Versions_1.MinecraftVersion.getVersion(version, options);
        }
        else {
            mcVersion = version;
        }
        let forgeVersion;
        if (forge) {
            if (forge === "recommended" || forge === "latest")
                forgeVersion = await Versions_1.ForgeVersion.getPromotedVersion(mcVersion, forge);
            else {
                let version = forge; //14.23.4.2709
                let build; // [14, 23, 4, 2709].reverse() => [2709,4,23,14][0] => 2709
                if (version.indexOf('.') === -1)
                    return null; // failsafe?
                build = parseInt(version.split('\.').reverse()[0]);
                forgeVersion = await Versions_1.ForgeVersion.getCustomVersion(build, version, mcVersion);
            }
        }
        if (!mcVersion)
            return null;
        return new MinecraftClient(mcVersion, forgeVersion, options, progress);
    }
    async checkInstallation() {
        this.progress.step("Installing Libraries");
        await this.libraryManager.installMinecraftLibraries(this.progress);
        if (this.forge) {
            this.progress.step("Installing Forge Libraries");
            await this.libraryManager.installForgeLibraries(this.forge, this.progress);
        }
        this.progress.step("Installing Assets");
        await this.assetManager.install(this.progress);
    }
    async checkMods(mods, exclusive) {
        this.progress.step("Installing Mods");
        mkdirp(path.join(this.options.gameDir, 'mods'));
        let files;
        if (exclusive)
            files = await mz_1.fs.readdir(path.join(this.options.gameDir, 'mods'));
        else
            files = [];
        files = files.filter(value => value.indexOf('.jar') !== -1);
        for (let i = 0; i < mods.length; i++) {
            let mod = mods[i];
            let id = mod.name.replace(/\s/g, '_');
            this.progress.call(i / mods.length);
            let file = path.join(this.options.gameDir, 'mods', id + '.jar');
            if (exclusive) {
                let i = files.indexOf(id + '.jar');
                if (i !== -1)
                    files.splice(i, 1);
            }
            if (mod.sha1)
                await Downloader_1.default.checkOrDownload(mod.url, mod.sha1, file);
            else
                await Downloader_1.default.existsOrDownload(mod.url, file);
        }
        if (exclusive) {
            let task = [];
            for (let i = 0; i < files.length; i++)
                task.push(mz_1.fs.unlink(path.join(this.options.gameDir, 'mods', files[i])));
            await Promise.all(task);
        }
    }
    async launch(auth, redirectOutput) {
        this.nativeDir = await this.libraryManager.unpackNatives(this.version);
        let args = [];
        args.push(`-Djava.library.path=${this.nativeDir}`);
        args.push('-cp');
        let classpath = this.libraryManager.getClasspath();
        args.push(classpath);
        args.push(...(this.options.javaArguments || []));
        args.push(...this.libraryManager.getLaunchArguments(auth));
        let cp = mz_1.child_process.spawn(this.options.javaExecutable, args, {
            cwd: this.options.gameDir
        });
        if (redirectOutput) {
            cp.stdout.pipe(process.stdout);
            cp.stderr.pipe(process.stderr);
        }
        return cp;
    }
}
MinecraftClient.defaultConfig = {
    javaArguments: [],
    javaExecutable: 'java'
};
exports.MinecraftClient = MinecraftClient;
//# sourceMappingURL=app.js.map