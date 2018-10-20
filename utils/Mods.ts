export interface ForgeMod {
    name: string;
    sha1?: string;

    file: string;

    url: string;

    type: SourceType;
}

export class CurseForgeMod implements ForgeMod {

    public name: string;
    public sha1: string;
    public type: SourceType;

    public file: string;

    public url: string;

    constructor(name: string, projectId: string | number, fileId: string | number, sha1?: string) {
        this.name = name;
        this.sha1 = sha1;
        this.file = `${projectId}`;
        this.type = "CurseForge";
        this.url = `https://minecraft.curseforge.com/projects/${projectId}/files/${fileId}/download`;
    }

}

export class CustomForgeMod implements ForgeMod {
    public name: string;
    public sha1: string;
    public type: SourceType;

    public file: string;

    public url: string;

    constructor(name: string, filename: string, url: string, sha1?: string) {
        this.name = name;
        this.sha1 = sha1;
        this.file = filename;
        this.type = "Direct";
        this.url = url;
    }
}

export declare type SourceType = 'CurseForge' | 'Direct';