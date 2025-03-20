import path from "path";
import { migrate } from 'drizzle-orm/postgres-js/migrator.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { handlerHealth, handlerMetrics, handlerReset, handlerValidateChirp } from "./api/handlers.js"
import { middlewareLogResponses, middlewareMetricsInc, middlewareHandleError } from "./api/middleware.js"
import express from "express";
import { config } from "./config";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();

app.use(middlewareLogResponses)
app.use(express.json())

app.get('/api/healthz', handlerHealth)
app.get('/admin/metrics', handlerMetrics);
app.post('/admin/reset', handlerReset)
app.post('/api/validate_chirp', handlerValidateChirp, middlewareHandleError)

app.use('/app', middlewareMetricsInc, express.static('./src/app'))

app.listen(config.api.port, config.api.url, () => {
	console.log(`Server is running at ${config.api.url}:${config.api.port}`);
});


