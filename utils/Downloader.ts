import * as fetch from 'node-fetch';
import * as unzip from 'unzipper';
import * as mkdir from 'mkdirp';
import {fs, crypto} from 'mz';
import * as path from 'path';

export default class Downloader {

    public static async getFile(url: string): Promise<Buffer> {
        let res: fetch.Response = await fetch.default(url);
        return await res.buffer();
    }

    public static async download(url: string, destination: string): Promise<void> {
        let res: fetch.Response = await fetch.default(url);
        await new Promise(r => mkdir(path.join(destination, '..'), r));
        await fs.writeFile(destination, await res.buffer());
    }

    public static async existsOrDownload(url: string, destination: string): Promise<void> {
        if(!await fs.exists(destination))
            return await Downloader.download(url, destination);
    }

    public static async checkOrDownload(url: string, sha1: string | string[], destination: string): Promise<void> {
        let result: boolean = true;
        if(await fs.exists(destination)) {
            let hash: crypto.Hash = crypto.createHash('sha1');
            hash.update(await fs.readFile(destination));
            if(Array.isArray(sha1)) {
                result = (<string[]>sha1).indexOf(hash.digest().toString('hex')) === -1;
            } else
                result = hash.digest().toString('hex') !== sha1;
        }
        if(result)
            return await this.download(url, destination);
    }

    public static async unpack(file: string, destination: string): Promise<void> {
        let input: fs.ReadStream = fs.createReadStream(file);
        let parse: unzip.ParseStream = input.pipe(unzip.Extract({
            path: destination
        }));
        await new Promise((resolve, reject) => {
            parse.on('close', resolve);
            parse.on('error', reject);
        });
    }

}