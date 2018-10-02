import {ForgeVersion, MinecraftVersion} from "./Versions";
import * as path from 'path';
import {fs} from 'mz';
import {ClientOptions} from "../app";
import Downloader from "./Downloader";
import * as unzipper from 'unzipper';
import * as fetch from 'node-fetch';
import * as mkdir from 'mkdirp';
import * as tmp from './TempHelper';
import {Endpoints, Utils} from "./Constants";
import {ForgeLibrary, ForgeLibraryManifest, MinecraftArtifact, MinecraftLibraryManifest} from "./Manifests";
import {AuthenticationResult} from "./Authentication";
import {InstallationProgress} from "./InstallationProgress";


export class LibraryManager {

    public options: ClientOptions;
    public version: MinecraftVersion;

    public mainClass: string;
    public minecraftArguments: string;

    public versionType: string;

    public assetIndex: string;

    constructor(options: ClientOptions, version: MinecraftVersion) {
        this.options = options;
        this.version = version;

        this.minecraftArguments = "";
        this.mainClass = "";

        this.versionType = "";
        this.assetIndex = "";
    }

    public async installMinecraftLibraries(progress: InstallationProgress): Promise<void> {
        let data: MinecraftLibraryManifest = await this.version.getLibraryManifest();

        for(let i = 0; i < data.libraries.length; i++) {
            progress.call(i/data.libraries.length);

            let lib = data.libraries[i];
            if(!LibraryHelper.applyRules(lib.rules)) {
                continue;
            }

            if(lib.downloads.artifact) {
                let dest: string = path.join(this.options.gameDir, 'libraries', lib.downloads.artifact.path);
                mkdir(path.join(dest, '..'));
                await Downloader.checkOrDownload(
                    lib.downloads.artifact.url,
                    lib.downloads.artifact.sha1,
                    dest
                );
            }
            if(lib.natives) {
                let classifier: string = lib.natives[Utils.platform];
                let artifact: MinecraftArtifact = lib.downloads.classifiers[classifier];
                let p: string = path.join(this.options.gameDir, 'libraries', artifact.path);
                await Downloader.checkOrDownload(
                    artifact.url,
                    artifact.sha1,
                    p
                );
            }
        }
        let client: MinecraftArtifact = data.downloads.client;
        await Downloader.checkOrDownload(client.url, client.sha1, path.join(this.options.gameDir, 'versions', this.version.id, this.version.id + '.jar'));

        progress.call(1);

        this.mainClass = data.mainClass;
        this.minecraftArguments = data.minecraftArguments;

        this.versionType = data.type;

        this.assetIndex = data.assets;
    }

    public async installForgeLibraries(version: ForgeVersion, progress: InstallationProgress): Promise<void> {
        let res: fetch.Response = await fetch.default(version.installer);
        let data: Buffer = await new Promise<Buffer>((accept, reject) => {
            res.body.pipe(unzipper.Parse())
                .on('entry', async function (entry) {
                    if (entry.path === "install_profile.json") {
                        let data: Buffer = await new Promise<Buffer>(resolve => {
                            let buffers: Buffer[] = [];
                            entry.on('data', (d: Buffer) => buffers.push(d));
                            entry.on('end', () => resolve(<Buffer>Buffer.concat(buffers)));
                        });
                        accept(data);
                    } else {
                        // noinspection JSIgnoredPromiseFromCall
                        entry.autodrain();
                    }
                })
                .on('close', () => reject());
        });
        let libraries: ForgeLibraryManifest = JSON.parse(data.toString());

        let libs: ForgeLibrary[] = libraries.versionInfo.libraries.filter(value => value.clientreq !== false);;
        for(let i = 0; i < libs.length; i++) {
            let lib = libs[i];
            progress.call(i/libs.length);

            let dest: string = path.join(this.options.gameDir, 'libraries', LibraryHelper.getArtifactPath(lib));
            mkdir(path.join(dest, '..'));
            let url: string = LibraryHelper.getArtifactUrl(lib);

            await Downloader.checkOrDownload(url, lib.checksums, dest);
        }
        let sha1: string = (await Downloader.getFile(version.universal + '.sha1')).toString();
        let dest: string = path.join(this.options.gameDir, 'libraries', 'net', 'minecraftforge', 'forge', version.version, `${version.mcversion}-${version.version}`, `forge-${version.mcversion}-${version.version}-universal.jar`);
        mkdir(path.join(dest, '..'));
        await Downloader.checkOrDownload(version.universal, sha1, dest);
        progress.call(1);
        this.mainClass = libraries.versionInfo.mainClass;
        this.minecraftArguments = libraries.versionInfo.minecraftArguments;

        this.versionType = 'ignored';
    }

    public async unpackNatives(version: MinecraftVersion): Promise<string> {
        let tmpDir: string = tmp.createTempDir();
        let data: MinecraftLibraryManifest = await version.getLibraryManifest();
        for(let i = 0; i < data.libraries.length; i++) {
            let lib: MinecraftLibrary = data.libraries[i];
            if(!LibraryHelper.applyRules(lib.rules))
                continue;
            if(!lib.natives)
                continue;
            if(lib.natives[Utils.platform]) {
                let classifier: string = lib.natives[Utils.platform];
                let artifact: MinecraftArtifact = lib.downloads.classifiers[classifier];
                let p: string = path.join(this.options.gameDir, 'libraries', artifact.path);
                await Downloader.unpack(p, tmpDir);
            }
        }
        return tmpDir;
    }

    public async getClasspath(): Promise<string> {
        let files: string[] = await tmp.tree(path.join(this.options.gameDir, 'libraries'));
        files = files.map(file => path.join('libraries', file));
        files.push(`versions/${this.version.id}/${this.version.id}.jar`);
        return files.join(Utils.classpathSeparator);
    }

    //--username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge
    //--username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}

    public getLaunchArguments(auth: AuthenticationResult): string[] {
        let args: string = this.minecraftArguments;
        args = args.replace("${auth_player_name}", auth.name);
        args = args.replace("${version_name}", this.version.id);
        args = args.replace("${game_directory}", this.options.gameDir);
        args = args.replace("${assets_root}", path.join(__dirname, 'assets'));
        args = args.replace("${assets_index_name}", this.assetIndex);
        args = args.replace("${auth_uuid}", auth.uuid);
        args = args.replace("${auth_access_token}", auth.token || "null");
        args = args.replace("${user_type}", "mojang");
        args = args.replace("${version_type}", this.versionType);
        return [this.mainClass].concat(args.split(" "));
    }

}

export declare type MinecraftLibrary = {
    name: string,
    downloads: {
        artifact: MinecraftArtifact,
        classifiers?: {
            "natives-osx"?: MinecraftArtifact
            "natives-linux"?: MinecraftArtifact
            "natives-windows"?: MinecraftArtifact
        }
    },
    extract?: {
        exclude?: [string]
    },
    natives?: {
        linux: "natives-linux",
        osx: "natives-osx",
        windows: "natives-windows"
    },
    rules?: [Rule]
}

class LibraryHelper {

    public static applyRules(rules: Rule[]): boolean {//true: download; false: ignore;
        if(!rules)
            return true;
        let result: boolean = false;
        for(let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            if(rule.os) {
                if (rule.os.name === Utils.platform)
                    result = rule.action === "allow";
            } else
                result = rule.action === "allow";
        }
        return result;
    }


    public static getArtifactUrl(lib: ForgeLibrary): string {
        return (lib.url || Endpoints.MINECRAFT_LIB_SERVER) + this.getArtifactPath(lib);
    }

    public static getArtifactPath(lib: ForgeLibrary): string {
        let parts: string[] = lib.name.split(':');
        let pkg: string = parts[0].replace(/\./g, '/');
        let artifact: string = parts[1];
        let version: string = parts[2];
        return `${pkg}/${artifact}/${version}/${artifact}-${version}.jar`;
    }

}

declare type Rule = {
    action: 'allow' | 'disallow',
    os?: {
        name: 'osx' | 'linux' | 'windows'
    }
}