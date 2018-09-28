export interface ForgeMod {
    name: string;
    sha1?: string;

    url: string;

    type: SourceType;
}

export class CurseForgeMod implements ForgeMod {

    public name: string;
    public sha1: string;
    public type: SourceType;

    public url: string;

    constructor(name: string, projectId: string | number, fileId: string | number, sha1?: string) {
        this.name = name;
        this.sha1 = sha1;
        this.type = "CurseForge";
        this.url = `https://minecraft.curseforge.com/projects/${projectId}/files/${fileId}/download`;
    }

}

export class CustomForgeMod implements ForgeMod {
    public name: string;
    public sha1: string;
    public type: SourceType;

    public url: string;

    constructor(name: string, url: string, sha1?: string) {
        this.name = name;
        this.sha1 = sha1;
        this.type = "Direct";
        this.url = url;
    }
}

export declare type SourceType = 'CurseForge' | 'Direct';