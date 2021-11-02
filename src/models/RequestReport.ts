export interface RequestReport {
    invalids: number;
    executes: number;
    valids: number;
    outcomes: string[];
    gasReports: string[];
    errorLogs: string[][];
}

export function createEmptyReport(): RequestReport {
    return {
        errorLogs: [],
        executes: 0,
        gasReports: [],
        invalids: 0,
        valids: 0,
        outcomes: [],
    }
}