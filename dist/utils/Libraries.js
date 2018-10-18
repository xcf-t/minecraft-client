"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Downloader_1 = require("./Downloader");
const unzipper = require("unzipper");
const fetch = require("node-fetch");
const mkdir = require("mkdirp");
const path = require("path");
const tmp = require("./TempHelper");
const Constants_1 = require("./Constants");
const mz_1 = require("mz");
class LibraryManager {
    constructor(options, version) {
        this.options = options;
        this.version = version;
        this.classpath = [];
        this.minecraftArguments = "";
        this.mainClass = "";
        this.versionType = "";
        this.assetIndex = "";
    }
    async installMinecraftLibraries(progress) {
        let data = await this.version.getLibraryManifest();
        for (let i = 0; i < data.libraries.length; i++) {
            progress.call(i / data.libraries.length);
            let lib = data.libraries[i];
            if (!LibraryHelper.applyRules(lib.rules)) {
                continue;
            }
            if (lib.downloads.artifact) {
                let dest = path.join(this.options.gameDir, 'libraries', lib.downloads.artifact.path);
                mkdir(path.join(dest, '..'));
                this.classpath.push(dest);
                await Downloader_1.default.checkOrDownload(lib.downloads.artifact.url, lib.downloads.artifact.sha1, dest);
            }
            if (lib.natives) {
                let classifier = lib.natives[Constants_1.Utils.platform];
                let artifact = lib.downloads.classifiers[classifier];
                if (!artifact.path)
                    continue;
                //natives to classpath?
                let p = path.join(this.options.gameDir, 'libraries', artifact.path);
                await Downloader_1.default.checkOrDownload(artifact.url, artifact.sha1, p);
            }
        }
        let client = data.downloads.client;
        this.classpath.push(`versions/${this.version.id}/${this.version.id}.jar`);
        await Downloader_1.default.checkOrDownload(client.url, client.sha1, path.join(this.options.gameDir, 'versions', this.version.id, this.version.id + '.jar'));
        progress.call(1);
        this.mainClass = data.mainClass;
        this.minecraftArguments = data.minecraftArguments;
        this.versionType = data.type;
        this.assetIndex = data.assets;
    }
    async installForgeLibraries(version, progress) {
        let data;
        let manifest = path.join(this.options.gameDir, `versions/${version.mcversion}/${version.mcversion}-forge.json`);
        if (await mz_1.fs.exists(manifest)) {
            data = await mz_1.fs.readFile(manifest);
        }
        else {
            let res = await fetch.default(version.installer);
            data = await new Promise((accept, reject) => {
                res.body.pipe(unzipper.Parse())
                    .on('entry', async function (entry) {
                    if (entry.path === "install_profile.json") {
                        let data = await new Promise(resolve => {
                            let buffers = [];
                            entry.on('data', (d) => buffers.push(d));
                            entry.on('end', () => resolve(Buffer.concat(buffers)));
                        });
                        accept(data);
                    }
                    else {
                        // noinspection JSIgnoredPromiseFromCall
                        entry.autodrain();
                    }
                })
                    .on('close', () => reject());
            });
            await mz_1.fs.writeFile(manifest, data);
        }
        let libraries = JSON.parse(data.toString());
        let libs = libraries.versionInfo.libraries.filter(value => value.clientreq !== false);
        ;
        for (let i = 0; i < libs.length; i++) {
            let lib = libs[i];
            progress.call(i / libs.length);
            let dest = path.join(this.options.gameDir, 'libraries', LibraryHelper.getArtifactPath(lib));
            mkdir(path.join(dest, '..'));
            this.classpath.push(dest);
            let url = LibraryHelper.getArtifactUrl(lib);
            await Downloader_1.default.checkOrDownload(url, lib.checksums, dest);
        }
        let sha1 = (await Downloader_1.default.getFile(version.universal + '.sha1')).toString();
        let dest = path.join(this.options.gameDir, 'libraries', 'net', 'minecraftforge', 'forge', version.version, `${version.mcversion}-${version.version}`, `forge-${version.mcversion}-${version.version}-universal.jar`);
        mkdir(path.join(dest, '..'));
        this.classpath.push(dest);
        await Downloader_1.default.checkOrDownload(version.universal, sha1, dest);
        progress.call(1);
        this.mainClass = libraries.versionInfo.mainClass;
        this.minecraftArguments = libraries.versionInfo.minecraftArguments;
        this.versionType = 'ignored';
    }
    async unpackNatives(version) {
        let tmpDir = tmp.createTempDir();
        let data = await version.getLibraryManifest();
        for (let i = 0; i < data.libraries.length; i++) {
            let lib = data.libraries[i];
            if (!LibraryHelper.applyRules(lib.rules))
                continue;
            if (!lib.natives)
                continue;
            if (lib.natives[Constants_1.Utils.platform]) {
                let classifier = lib.natives[Constants_1.Utils.platform];
                let artifact = lib.downloads.classifiers[classifier];
                if (!artifact.path)
                    continue;
                let p = path.join(this.options.gameDir, 'libraries', artifact.path);
                await Downloader_1.default.unpack(p, tmpDir);
            }
        }
        return tmpDir;
    }
    getClasspath() {
        /*let files: string[] = await tmp.tree(path.join(this.options.gameDir, 'libraries'));
        files = files.map(file => path.join('libraries', file));
        files.push(`versions/${this.version.id}/${this.version.id}.jar`);
        return files.join(Utils.classpathSeparator);*/
        return this.classpath.join(Constants_1.Utils.classpathSeparator);
    }
    //--username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge
    //--username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}
    getLaunchArguments(auth) {
        let args = this.minecraftArguments;
        args = args.replace("${auth_player_name}", auth.name);
        args = args.replace("${version_name}", this.version.id);
        args = args.replace("${game_directory}", this.options.gameDir);
        args = args.replace("${assets_root}", path.join(this.options.gameDir, 'assets'));
        args = args.replace("${assets_index_name}", this.assetIndex);
        args = args.replace("${auth_uuid}", auth.uuid);
        args = args.replace("${auth_access_token}", auth.token || "null");
        args = args.replace("${user_type}", "mojang");
        args = args.replace("${version_type}", this.versionType);
        args = args.replace("${user_properties}", "{}");
        return [this.mainClass].concat(args.split(" "));
    }
}
exports.LibraryManager = LibraryManager;
class LibraryHelper {
    static applyRules(rules) {
        if (!rules)
            return true;
        let result = false;
        for (let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            if (rule.os) {
                if (rule.os.name === Constants_1.Utils.platform)
                    result = rule.action === "allow";
            }
            else
                result = rule.action === "allow";
        }
        return result;
    }
    static getArtifactUrl(lib) {
        return (lib.url || Constants_1.Endpoints.MINECRAFT_LIB_SERVER) + this.getArtifactPath(lib);
    }
    static getArtifactPath(lib) {
        let parts = lib.name.split(':');
        let pkg = parts[0].replace(/\./g, '/');
        let artifact = parts[1];
        let version = parts[2];
        return `${pkg}/${artifact}/${version}/${artifact}-${version}.jar`;
    }
}
//# sourceMappingURL=Libraries.js.map