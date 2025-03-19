import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../errors.js"

import { config } from "../config.js"

export function handlerHealth(_req: Request, res: Response) {
	res.set('Content-Type', "text/plain; charset=utf-8");
	res.send('OK');
}

export function handlerMetrics(_req: Request, res: Response) {
	res.set('Content-Type', "text/html; charset=utf-8");
	res.send(`<html>
  <body style="background-color:#121212">
    <h1 style="color:white">Welcome, Chirpy Admin</h1>
    <p style="color:white">Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`);
}


export function handlerReset(_req: Request, res: Response) {

	config.fileserverHits = 0;
	res.set('Content-Type', "text/plain; charset=utf-8");
	res.send('Count Reset\n')
}

export function handlerValidateChirp(req: Request, res: Response, next: NextFunction) {
	type parameters = {
		body: string
	}
	const words = ["kerfuffle", "sharbert", "fornax"]

	try {
		const parsedBody: parameters = req.body;
		if (parsedBody.body.length > 140) {
			throw new BadRequestError("Chirp is too long. Max length is 140")
		} else {
			parsedBody.body = parsedBody.body.split(" ").reduce(
				(acc: string, i: string) =>
					acc + (words.includes(i.toLowerCase()) ? '****' : i) + " ",
				"")
			const resBody = { 'cleanedBody': parsedBody.body.trimEnd() }
			res.status(200).send(JSON.stringify(resBody))

		}
	} catch (err) {
		next(err)
	}

}
