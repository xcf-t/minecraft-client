"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Versions_1 = require("./utils/Versions");
const path = require("path");
const Downloader_1 = require("./utils/Downloader");
const Libraries_1 = require("./utils/Libraries");
const Assets_1 = require("./utils/Assets");
const mz_1 = require("mz");
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
            if (typeof forge === 'string') {
                forgeVersion = await Versions_1.ForgeVersion.getPromotedVersion(mcVersion, forge);
            }
            else {
                forgeVersion = Versions_1.ForgeVersion.getCustomVersion(forge.build, forge.version, mcVersion);
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
    async checkMods(...mods) {
        this.progress.step("Installing mod");
        for (let i = 0; i < mods.length; i++) {
            let mod = mods[i];
            this.progress.call(i / mods.length);
            let file = path.join(this.options.gameDir, 'mods', `${mod.name.replace(/\s/g, '_')}.jar`);
            if (mod.sha1)
                await Downloader_1.default.checkOrDownload(mod.url, mod.sha1, file);
            else
                await Downloader_1.default.existsOrDownload(mod.url, file);
        }
    }
    async launch(auth) {
        this.nativeDir = await this.libraryManager.unpackNatives(this.version);
        let args = [];
        args.push(`-Djava.library.path=${this.nativeDir}`);
        args.push('-cp');
        let classpath = await this.libraryManager.getClasspath();
        args.push(classpath);
        args.push(...(this.options.javaArguments || []));
        args.push(...this.libraryManager.getLaunchArguments(auth));
        let cp = mz_1.child_process.spawn(this.options.javaExecutable, args, {
            cwd: this.options.gameDir
        });
        cp.stdout.pipe(process.stdout);
        cp.stderr.pipe(process.stderr);
        return cp;
    }
}
MinecraftClient.defaultConfig = {
    javaArguments: [],
    javaExecutable: 'java'
};
exports.MinecraftClient = MinecraftClient;
//# sourceMappingURL=app.js.map