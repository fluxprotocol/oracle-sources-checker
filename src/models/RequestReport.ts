export interface RequestReport {
    invalids: number;
    executes: number;
    valids: number;
    outcomes: string[];
    gasReports: string[];
    logs: {
        [executeId: number]: string[];
    };
}

export function createEmptyReport(): RequestReport {
    return {
        logs: {},
        executes: 0,
        gasReports: [],
        invalids: 0,
        valids: 0,
        outcomes: [],
    }
}