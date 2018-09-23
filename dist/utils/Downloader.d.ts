export declare class FSHelper {
    static recursiveCopy(src: string, dest: string): Promise<void>;
}
export default class Downloader {
    static download(url: string, destination: string): Promise<object | Error>;
    static existsOrDownload(url: string, destination: string): Promise<object | Error>;
    static checkOrDownload(url: string, sha1: string, destination: string): Promise<object | Error>;
}
