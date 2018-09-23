import * as mkdir from 'mkdirp';
import * as path from 'path';
import * as os from 'os';

import {fs} from 'mz';

export async function tree(dir: string, filePath: string = ""): Promise<string[]> {
    let result: string[] = [];
    let files: string[] = await fs.readdir(dir);
    for(let i = 0; i < files.length; i++) {
        let file: string = files[i];
        let stat: fs.Stats = await fs.stat(path.join(dir, file));
        if(stat.isDirectory()) {
            result.push(...await tree(path.join(dir, file), path.join(filePath, file)));
        } else if(stat.isFile()) {
            result.push(path.join(filePath, path.basename(file)));
        }
    }
    return result;
}

export function createTempDir(): string {
    let dir: string = path.join(os.tmpdir(), uuid());
    mkdir(dir);
    return dir;
}

function uuid(): string {
    return Math.round(Math.random()*1e14).toString(16).toUpperCase();
}