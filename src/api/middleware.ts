import { Request, Response, NextFunction } from "express";
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from "../errors.js"

import { config } from "../config.js"

export function middlewareLogResponses(req: Request, res: Response, next: NextFunction) {
	res.on('finish', () => {
		if (res.statusCode > 299) {
			console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`)
		}
	})
	next()
}


export function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
	config.api.fileserverHits++
	next()
}

export function middlewareHandleError(err: Error, req: Request, res: Response, next: NextFunction) {
	console.log(err);
	const body = {
		"error": err.message
	}

	let status: number;
	if (err instanceof BadRequestError) status = 400
	else if (err instanceof UnauthorizedError) status = 401
	else if (err instanceof ForbiddenError) status = 403
	else if (err instanceof NotFoundError) status = 404
	else status = 500

	res.set('Content-Type', "application/json; charset=utf-8");
	res.status(status).send(JSON.stringify(body))
}
