import { NextFunction, Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../errors.js"

import { config } from "../config.js"
import { createUser, deleteUsers } from "../db/queries/users.js"
import { createChirp, getAlLChirps, getChirp } from "../db/queries/chirps.js";

export function handlerHealth(_req: Request, res: Response) {
	res.set('Content-Type', "text/plain; charset=utf-8");
	res.send('OK');
}

export function handlerMetrics(_req: Request, res: Response) {
	res.set('Content-Type', "text/html; charset=utf-8");
	res.send(`<html>
  <body style="background-color:#121212">
    <h1 style="color:white">Welcome, Chirpy Admin</h1>
    <p style="color:white">Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>`);
}


export async function handlerReset(_req: Request, res: Response) {
	if (config.api.platform !== 'dev') {
		res.status(403).send('403 Forbidden')
	}
	config.api.fileserverHits = 0;
	await deleteUsers();

	res.set('Content-Type', "text/plain; charset=utf-8");
	res.send('Count Reset\n')
}

export async function handlerAddUser(req: Request, res: Response, next: NextFunction) {
	type parameters = { email: string }
	try {
		const parsedBody: parameters = req.body
		if (parsedBody.email) {
			const user = await createUser({ email: parsedBody.email })
			res.status(201).send(JSON.stringify(user))
		} else {
			throw new BadRequestError("User email is missing")
		}
	}
	catch (err) {
		next(err)
	}
}

export async function handlerChirp(req: Request, res: Response, next: NextFunction) {
	type parameters = { body: string, userId: string }
	const words = ["kerfuffle", "sharbert", "fornax"]

	try {
		const parsedBody: parameters = req.body
		if (!parsedBody.body || !parsedBody.userId) {
			throw new BadRequestError(`Missing Values in request ${parsedBody}`)
		}
		if (parsedBody.body.length > 140) {
			throw new BadRequestError("Chirp is too long. Max length is 140")
		}
		const cleanedBody = parsedBody.body.split(" ").reduce(
			(acc: string, i: string) =>
				acc + (words.includes(i.toLowerCase()) ? '****' : i) + " ",
			"")
		const chirp = await createChirp({ body: cleanedBody.trimEnd(), userId: parsedBody.userId })
		res.status(201).send(JSON.stringify(chirp))


	} catch (err) {
		next(err)
	}
}

export async function handlerGetChirps(_req: Request, res: Response, next: NextFunction) {

	try {
		const chirps = await getAlLChirps();
		res.status(200).send(JSON.stringify(chirps))

	} catch (err) {
		next(err)
	}
}


export async function handlerGetChirpById(req: Request, res: Response, next: NextFunction) {
	try {
		const userid = req.params.uuid
		const chirp = await getChirp(userid);
		if (!chirp) throw new NotFoundError("Chirp not found");
		res.status(200).send(JSON.stringify(chirp))

	} catch (err) {
		next(err)
	}
}
