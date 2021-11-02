import { DataRequest } from "./DataRequest";
import { RequestReport } from "./RequestReport";

export interface WalkerEntry {
    active: boolean;
    request: DataRequest;
    lastExecuted: number;
    stopExecutingAt: number;
    report: RequestReport;
}