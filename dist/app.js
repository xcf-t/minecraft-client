"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Versions_1 = require("./utils/Versions");
const Libraries_1 = require("./utils/Libraries");
const Assets_1 = require("./utils/Assets");
const mz_1 = require("mz");
var Authentication_1 = require("./utils/Authentication");
exports.Authentication = Authentication_1.Authentication;
const Authentication_2 = require("./utils/Authentication");
class MinecraftClient {
    constructor(version, forge, options = MinecraftClient.defaultConfig) {
        for (let i in MinecraftClient.defaultConfig)
            if (!options[i])
                options[i] = MinecraftClient.defaultConfig[i];
        this.options = options;
        this.version = version;
        this.forge = forge;
        this.libraryManager = new Libraries_1.LibraryManager(options, version);
        this.assetManager = new Assets_1.AssetManager(options, version);
    }
    static getMinecraftClient(version, options) {
        return this.getClient(version, null, options);
    }
    static getForgeClient(version, forge, options) {
        return this.getClient(version, forge, options);
    }
    static async getClient(version, forge, options) {
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
        return new MinecraftClient(mcVersion, forgeVersion, options);
    }
    async checkInstallation() {
        await this.libraryManager.installMinecraftLibraries();
        if (this.forge)
            await this.libraryManager.installForgeLibraries(this.forge);
        await this.assetManager.install();
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
MinecraftClient.getForgeClient("1.12.2", {
    version: "14.23.4.2709",
    build: 2709
}, {
    gameDir: "/tmp/.minecraft"
})
    .then(async (c) => {
    await c.checkInstallation();
    await c.launch(Authentication_2.Authentication.offline("Nobody"));
});
//# sourceMappingURL=app.js.map