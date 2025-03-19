import path from "path";
import { handlerHealth, handlerMetrics, handlerReset, handlerValidateChirp } from "./api/handlers.js"
import { middlewareLogResponses, middlewareMetricsInc, middlewareHandleError } from "./api/middleware.js"
import express from "express";


const app = express();
const PORT = 8080

app.use(middlewareLogResponses)
app.use(express.json())

app.get('/api/healthz', handlerHealth)
app.get('/admin/metrics', handlerMetrics);
app.post('/admin/reset', handlerReset)
app.post('/api/validate_chirp', handlerValidateChirp, middlewareHandleError)

app.use('/app', middlewareMetricsInc, express.static('./src/app'))

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});


