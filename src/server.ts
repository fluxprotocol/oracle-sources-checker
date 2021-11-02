import express from 'express';
import { HTTP_PORT } from './config';
import { createRequestsController } from './controllers/RequestsController';
import JobWalker from './JobWalker';

export async function startHttpServer(jobWalker: JobWalker) {
    const app = express();

    app.use(express.json());
    app.use('/requests', createRequestsController(jobWalker));

    app.listen(HTTP_PORT, () => {
        console.info(`HTTP Server listening on ${HTTP_PORT}`)
    });
}