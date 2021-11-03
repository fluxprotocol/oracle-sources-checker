import { LoggedOutcome } from "@fluxprotocol/oracle-vm";
import { WALKER_INTERVAL } from "./config";
import { DataRequest } from './models/DataRequest'
import { createEmptyReport } from "./models/RequestReport";
import { WalkerEntry } from "./models/WalkerEntry";
import { saveReport } from "./services/ReportService";
import { executeRequest } from "./services/WasmExecuter";

export default class JobWalker {
    requests: Map<string, WalkerEntry> = new Map();
    processing: Map<string, Promise<void>> = new Map();

    constructor(entries: WalkerEntry[]) {
        entries.forEach(entry => this.requests.set(entry.request.id, entry));
    }

    addRequest(request: DataRequest) {
        if (this.requests.has(request.id)) return;

        this.requests.set(request.id, {
            active: true,
            lastExecuted: 0,
            report: createEmptyReport(),
            request,
            stopExecutingAt: new Date().getTime() + request.executeTime,
        });
    }

    async removeRequest(id: string) {
        if (this.processing.has(id)) {
            await this.processing.get(id); 
        }

        const request = this.requests.get(id);
        if (!request) return;

        request.active = false;
        await saveReport(request);

        this.requests.delete(id);

        return request;
    }

    async walkRequest(entry: WalkerEntry) {
        try {
            const now = new Date().getTime();
    
            if (now < (entry.lastExecuted + entry.request.interval)) {
                return;
            }
    
            console.info(`${entry.request.id} - Executing`);
            const result = await executeRequest(entry.request);
            const resultEntry: WalkerEntry = {
                ...entry,
                lastExecuted: new Date().getTime(),
            };
    
            resultEntry.report.executes += 1;
    
            if (!resultEntry.report.gasReports.includes(result.gasUsed)) {
                resultEntry.report.gasReports.push(result.gasUsed);
            }
            
            if (result.code !== 0) {
                resultEntry.report.invalids += 1;
                resultEntry.report.errorLogs.push(result.logs);
            } else {
                const loggedResult: LoggedOutcome = JSON.parse(result.logs[result.logs.length - 1]);
    
                if (loggedResult.type === 'Invalid') {
                    resultEntry.report.invalids += 1;
                    resultEntry.report.errorLogs.push(result.logs);
                } else {
                    resultEntry.report.valids += 1;
                    
                    if (!resultEntry.report.outcomes.includes(loggedResult.value)) {
                        resultEntry.report.outcomes.push(loggedResult.value);
                    }
                }
            }
    
            await saveReport(resultEntry);
            this.requests.set(resultEntry.request.id, resultEntry);
    
            console.info(`${resultEntry.request.id} - Done executing`);
        } catch (error: any) {
            const resultEntry: WalkerEntry = {
                ...entry,
                lastExecuted: new Date().getTime(),
            };

            resultEntry.report.errorLogs.push(error?.toString() ?? error);

            await saveReport(resultEntry);
            this.requests.set(resultEntry.request.id, resultEntry);

            console.error(`${resultEntry.request.id} - Done executing with error ${error}`);
        }
    }

    async walkAllRequests() {
        const requests = Array.from(this.requests.values());

        requests.forEach(async (entry) => {
            if (this.processing.has(entry.request.id)) return;

            const now = new Date().getTime();

            if (entry.stopExecutingAt < now) {
                console.info(`${entry.request.id} - Removing due being finished`);
                entry.active = false;
                this.requests.delete(entry.request.id);
                await saveReport(entry);
                return;
            }

            const processingRequest = this.walkRequest(entry)
            this.processing.set(entry.request.id, processingRequest);
            await processingRequest;
            this.processing.delete(entry.request.id);
        });
    }

    startWalker() {
        setInterval(() => {
            this.walkAllRequests();
        }, WALKER_INTERVAL);
    }
}