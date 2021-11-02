import { createHash } from 'crypto';
import { DEFAULT_EXECUTE_TIME, DEFAULT_JOB_INTERVAL } from '../config';

export interface DataRequestStringDataType {
    type: 'string';
}

export interface DataRequestNumberDataType {
    multiplier: string;
    type: 'number';
}

export declare type DataRequestDataType = DataRequestNumberDataType | DataRequestStringDataType;

export interface DataRequestSource {
    end_point: string;
    source_path: string;
}

export interface DataRequest {
    id: string;
    sources: DataRequestSource[];
    dataType: DataRequestDataType;
    interval: number;
    executeTime: number;
}

export function createRequestFromObject(object: any): DataRequest {
    if (!object) throw new Error('NO_OBJECT');
    if (!Array.isArray(object.sources)) throw new Error('ERR_NO_SOURCES');

    // Checking each source
    object.sources.forEach((source: Partial<DataRequestSource>) => {
        if (!source.end_point) throw new Error('ERR_NO_ENDPOINT');
        if (!source.source_path) throw new Error('ERR_NO_SOURCE_PATH');
    });

    if (!object.dataType) throw new Error('ERR_NO_DATA_TYPE');
    if (object.dataType.type !== 'string' && object.dataType.type !== 'number') throw new Error('ERR_UNSUPPORTED_DATA_TYPE');

    if (object.dataType.type === 'number') {
        if (!object.dataType.multiplier) throw new Error('ERR_NO_MULTIPLIER');
    }

    if (object.interval) {
        if (isNaN(object.interval)) throw new Error('ERR_INVALID_INTERVAL');
    }

    if (object.executeTime) {
        if (isNaN(object.executeTime)) throw new Error('ERR_INVALID_EXECUTE_TIME');
    }

    const hash = createHash('sha256');
    hash.update(JSON.stringify(object));

    return {
        dataType: object.dataType,
        sources: object.sources,
        id: '0x' + hash.digest('hex'),
        interval: object.interval ?? DEFAULT_JOB_INTERVAL,
        executeTime: object.executeTime ?? DEFAULT_EXECUTE_TIME,
    };
}