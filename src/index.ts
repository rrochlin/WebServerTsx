import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { handlerAddUser, handlerHealth, handlerMetrics, handlerReset, handlerChirp, handlerGetChirps, handlerGetChirpById } from "./api/handlers.js"
import { middlewareLogResponses, middlewareMetricsInc, middlewareHandleError } from "./api/middleware.js"
import express from "express";
import { config } from "./config.js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();

app.use(middlewareLogResponses)
app.use(express.json())

app.get('/api/healthz', handlerHealth);
app.get('/admin/metrics', handlerMetrics);
app.post('/admin/reset', handlerReset);
app.post('/api/users', handlerAddUser, middlewareHandleError);
app.post('/api/chirps', handlerChirp, middlewareHandleError);
app.get('/api/chirps', handlerGetChirps, middlewareHandleError);
app.get('/api/chirps/:uuid', handlerGetChirpById, middlewareHandleError);


app.use('/app', middlewareMetricsInc, express.static('./src/app'))

app.listen(config.api.port, config.api.url, () => {
	console.log(`Server is running at ${config.api.url}:${config.api.port}`);
});


