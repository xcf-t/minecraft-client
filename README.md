# Minecraft Client

## Usage

```Typescript
import {MinecraftClient} from 'minecraft-client';

//Vanilla Minecraft Client
let client: MinecraftClient = await MinecraftClient.getMinecraftClient("1.12.2", {
    gameDir: '/home/username/.minecraft'
});

//Forge Minecraft Client with promoted Version
let client: MinecraftClient = await MinecraftClient.getForgeClient("1.12.2", "recommended", {
    gameDir: '/home/username/.minecraft'
});

//Forge Minecraft Client with custom Version
let client: MinecraftClient = await MinecraftClient.getForgeClient("1.12.2", {
    version: "14.23.4.2709",
    build: 2709
}, {
    gameDir: '/home/username/.minecraft'
});

```

Valid Forge version types:
- latest
- recommended

### Authentication

```TypeScript
import {Authentication} from 'minecraft-client';

//Offline Authentication
client.launch(Authentication.offline("Username"));

//Username/Password Authentication
client.launch(await Authentication.login("Username (Email)", "Password"));

//Token Authentication
client.launch(await Authentication.refresh("accessToken"));
```

### Mods

```TypeScript
import {CurseForgeMod, CustomForgeMod, ForgeMod} from 'minecraft-client';

//List Mods
let mods: ForgeMod[] = [
    new CurseForgeMod("Iron Chests", 228756, 2595146),
    new CustomForgeMod("DynmapBlockScan", "http://www.dynmap.us/builds/DynmapBlockScan/DynmapBlockScan-3.0-alpha-1-forge-1.12.2.jar")
];

//Install Mods
client.checkMods(mods);
```