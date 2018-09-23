"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Endpoints;
(function (Endpoints) {
    Endpoints["VERSION_MANIFEST"] = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
    Endpoints["FORGE_VERSION_MANIFEST"] = "https://files.minecraftforge.net/maven/net/minecraftforge/forge/json";
    Endpoints["FORGE_MAVEN_ARTIFACT"] = "https://files.minecraftforge.net/maven/net/minecraftforge/forge/";
    Endpoints["MINECRAFT_LIB_SERVER"] = "https://libraries.minecraft.net/";
    Endpoints["MINECRAFT_AUTH_SERVER"] = "https://authserver.mojang.com/";
    Endpoints["MINECRAFT_ASSET_SERVER"] = "http://resources.download.minecraft.net/";
})(Endpoints = exports.Endpoints || (exports.Endpoints = {}));
class Utils {
    static getPlatform() {
        switch (process.platform) {
            case "win32":
                return "windows";
            case "darwin":
                return "osx";
            default:
                return process.platform;
        }
    }
}
Utils.platform = Utils.getPlatform();
Utils.classpathSeparator = Utils.platform === 'windows' ? ';' : ':';
exports.Utils = Utils;
//# sourceMappingURL=Constants.js.map