export declare enum Endpoints {
    VERSION_MANIFEST = "https://launchermeta.mojang.com/mc/game/version_manifest.json",
    FORGE_VERSION_MANIFEST = "https://files.minecraftforge.net/maven/net/minecraftforge/forge/json",
    FORGE_MAVEN_ARTIFACT = "https://files.minecraftforge.net/maven/net/minecraftforge/forge/",
    MINECRAFT_LIB_SERVER = "https://libraries.minecraft.net/",
    MINECRAFT_AUTH_SERVER = "https://authserver.mojang.com/",
    MINECRAFT_ASSET_SERVER = "http://resources.download.minecraft.net/"
}
export declare class Utils {
    static platform: string;
    static classpathSeparator: string;
    static getPlatform(): string;
}
