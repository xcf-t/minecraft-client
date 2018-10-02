export interface ForgeMod {
    name: string;
    sha1?: string;
    url: string;
    type: SourceType;
}
export declare class CurseForgeMod implements ForgeMod {
    name: string;
    sha1: string;
    type: SourceType;
    url: string;
    constructor(name: string, projectId: string | number, fileId: string | number, sha1?: string);
}
export declare class CustomForgeMod implements ForgeMod {
    name: string;
    sha1: string;
    type: SourceType;
    url: string;
    constructor(name: string, url: string, sha1?: string);
}
export declare type SourceType = 'CurseForge' | 'Direct';
