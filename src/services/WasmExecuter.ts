import { execute, InMemoryCache } from '@fluxprotocol/oracle-vm';
import { ExecuteResult } from '@fluxprotocol/oracle-vm/dist/models/ExecuteResult';
import { promises } from 'fs';
import toPath from 'lodash.topath';

import { DataRequest } from '../models/DataRequest';


export function convertOldSourcePath(sourcePath: string): string {
    // Keep support for more functions
    if (sourcePath.startsWith('$')) {
        return sourcePath;
    }

    const pathCrumbs = toPath(sourcePath);
    let result = '$';

    pathCrumbs.forEach((crumb) => {
        // Is an array path
        if (!isNaN(Number(crumb))) {
            result += `[${crumb}]`;
        } else if (crumb === '$$last') {
            result += '[-1:]';
        } else {
            result += `.${crumb}`;
        }
    });

    return result;
}

let cachedDefaultBinary: Buffer;

async function loadBinary() {
    try {
        if (cachedDefaultBinary) {
            return cachedDefaultBinary;
        }

        cachedDefaultBinary = await promises.readFile('./vendor/basic-fetch/res/basic-fetch.wasm');
        return cachedDefaultBinary;
    } catch (error) {
        console.error(`Could not load binary at ./vendor/basic-fetch/res/basic-fetch.wasm: ${error}`);
        process.exit(1);
    }
}

loadBinary();

const vmCache = new InMemoryCache();

export async function executeRequest(request: DataRequest): Promise<ExecuteResult> {
    try {
        const args: string[] = [
            '0x0000000000000000000000000000000000000001',
            JSON.stringify(request.sources.map((source) => ({
                source_path: convertOldSourcePath(source.source_path),
                end_point: source.end_point,
            }))),
            request.dataType.type,
        ];

        if (request.dataType.type === 'number') {
            args.push(request.dataType.multiplier.toString());
        }

        const result = await execute({
            args,
            binary: await loadBinary(),
            env: {}, 
            gasLimit: (300_000_000_000_000).toString(),
            randomSeed: '0x0001',
            timestamp: 1,
        }, vmCache);

        return result;
    } catch (error: any) {
        console.error('[executeRequest]', error);

        return {
            code: 1,
            gasUsed: '0',
            logs: [
                error ?? error.toString(),
            ],
        }
    }
}