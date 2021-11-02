import express from 'express';
import JobWalker from '../JobWalker';
import { createRequestFromObject } from '../models/DataRequest';
import { getReport } from '../services/ReportService';

export function createRequestsController(jobWalker: JobWalker) {
    const RequestsController = express.Router();

    RequestsController.post('/', (req, res) => {
        const request = createRequestFromObject(req.body);
        jobWalker.addRequest(request);
        res.json(request);
    });

    RequestsController.get('/:id', async (req, res) => {
        const report = await getReport(req.params.id);

        res.json({
            data: report,
        });
    });

    return RequestsController;
}