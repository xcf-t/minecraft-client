/// <reference types="node" />
export default class Downloader {
    static getFile(url: string): Promise<Buffer>;
    static download(url: string, destination: string): Promise<void>;
    static existsOrDownload(url: string, destination: string): Promise<void>;
    static checkOrDownload(url: string, sha1: string | string[], destination: string): Promise<void>;
    static unpack(file: string, destination: string): Promise<void>;
}
