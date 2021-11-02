import { WalkerEntry } from "../models/WalkerEntry";
import { writeFile, readdir, readFile } from 'fs/promises';
import { REPORTS_FOLDER } from "../config";

interface ReportFileContents {
    data: WalkerEntry;
}

export async function saveReport(entry: WalkerEntry) {
    const item: ReportFileContents = {
        data: entry,
    };
    
    await writeFile(`${REPORTS_FOLDER}/${item.data.request.id}.json`, JSON.stringify(item, null, 4));
}

export async function restoreAllReports(): Promise<WalkerEntry[]> {
    const files = await readdir(`${REPORTS_FOLDER}`);
    const reports: WalkerEntry[] = [];

    await Promise.all(files.map(async (file) => {
        if (!file.endsWith('.json')) return;
        const fileContents = await readFile(`${REPORTS_FOLDER}${file}`);
        const data = JSON.parse(fileContents.toString()).data;

        if (data.active) {
            reports.push(data);
        }
    }));

    return reports;
}

export async function getReport(id: string): Promise<WalkerEntry | null> {
    try {
        const file = await readFile(`${REPORTS_FOLDER}${id}.json`);

        return JSON.parse(file.toString()).data;
    } catch (error: any) {
        console.error(error);
        return null;
    }
}