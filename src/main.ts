import JobWalker from "./JobWalker";
import { startHttpServer } from "./server";
import { restoreAllReports } from "./services/ReportService";

async function main() {
    const currentEntries = await restoreAllReports();
    const walker = new JobWalker(currentEntries);

    startHttpServer(walker);
    walker.startWalker();
}

main();