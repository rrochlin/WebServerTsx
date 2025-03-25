import { NextFunction, Request, Response } from "express";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "../errors.js"

import { config } from "../config.js"
import { createUser, deleteUsers, getUserByEmail, toPublicUser, updateUserInfo } from "../db/queries/users.js"
import { createChirp, deleteChirp, getAlLChirps, getChirp } from "../db/queries/chirps.js";
import { checkPasswordHash, hashPassword, makeJWT, validateJWT, getBearerToken, makeRefreshToken } from "./auth.js";
import { getRefreshToken, getUserFromRefreshToken, revokeRefreshToken } from "../db/queries/refreshTokens.js";

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
	type parameters = { email: string, password: string }
	try {
		const parsedBody: parameters = req.body
		if (parsedBody.email && parsedBody.password) {
			const user = await createUser(
				{
					email: parsedBody.email,
					hashed_password: await hashPassword(parsedBody.password)
				})
			res.status(201).send(JSON.stringify(toPublicUser(user)))
		} else {
			throw new BadRequestError("User info is missing")
		}
	}
	catch (err) {
		next(err)
	}
}

export async function handlerChirp(req: Request, res: Response, next: NextFunction) {
	type parameters = { body: string, userId: string, token: string }
	const words = ["kerfuffle", "sharbert", "fornax"]

	try {
		const parsedBody: parameters = req.body
		const jwt = getBearerToken(req)
		const uuid = validateJWT(jwt, config.api.secret)
		if (!uuid) throw new BadRequestError("user id missing from token")
		if (!parsedBody.body) {
			throw new BadRequestError(`Missing Values in request ${parsedBody}`)
		}
		if (parsedBody.body.length > 140) {
			throw new BadRequestError("Chirp is too long. Max length is 140")
		}
		const cleanedBody = parsedBody.body.split(" ").reduce(
			(acc: string, i: string) =>
				acc + (words.includes(i.toLowerCase()) ? '****' : i) + " ",
			"")
		const chirp = await createChirp({ body: cleanedBody.trimEnd(), userId: uuid })
		res.status(201).send(JSON.stringify(chirp))


	} catch (err) {
		next(err)
	}
}

export async function handlerGetChirps(req: Request, res: Response, next: NextFunction) {

	try {
		const authorId = req.query.authorId
		const sort = req.query.sort === 'asc' || req.query.sort === 'desc' ? req.query.sort : 'asc'
		if (authorId) var chirps = await getAlLChirps(sort, authorId.toString())
		else var chirps = await getAlLChirps(sort);
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


export async function handlerLogin(req: Request, res: Response, next: NextFunction) {
	type parameter = {
		email: string,
		password: string,
	}
	try {
		const parsedBody: parameter = req.body
		if (!parsedBody.email || !parsedBody.password) {
			throw new BadRequestError("Login requires an email and password");
		}

		const attemptedUser = await getUserByEmail(parsedBody.email)
		if (!(await checkPasswordHash(parsedBody.password, attemptedUser.hashed_password))) {
			throw new UnauthorizedError("Incorrect email or password")
		}

		const jwt = makeJWT(attemptedUser.id, 3600, config.api.secret)
		const rt = await makeRefreshToken(attemptedUser.id)
		res.status(200).send(JSON.stringify({
			...toPublicUser(attemptedUser),
			"token": jwt,
			"refreshToken": rt.token,
		}))

	} catch (err) {
		next(err)
	}
}


export async function handlerRefresh(req: Request, res: Response, next: NextFunction) {
	type response = {
		token: string
	}
	try {
		const rawToken = getBearerToken(req)
		const token = await getRefreshToken(rawToken)
		if (token.revokedAt != null || token.expiresAt < new Date()) {
			throw new UnauthorizedError("invalid refresh token")
		}
		const user = await getUserFromRefreshToken(token.token)
		const jwt = makeJWT(user, 3600, config.api.secret)
		const r: response = { token: jwt }
		res.status(200).send(JSON.stringify(r))

	} catch (err) {
		next(err)
	}
}

export async function handlerRevoke(req: Request, res: Response, next: NextFunction) {
	try {
		const token = getBearerToken(req)
		await revokeRefreshToken(token)
		res.status(204).send()
	} catch (err) {
		next(err)
	}
}


export async function handlerUsers(req: Request, res: Response, next: NextFunction) {
	type parametes = { email: string, password: string }
	try {
		const parsedBody: parametes = req.body
		const rawToken = getBearerToken(req)
		const userid = validateJWT(rawToken, config.api.secret)
		const result = await updateUserInfo({
			id: userid, email: parsedBody.email,
			hashed_password: await hashPassword(parsedBody.password)
		})
		res.status(200).send(JSON.stringify(toPublicUser(result)))

	}
	catch (err) { next(err) }
}

export async function handlerDeleteChirp(req: Request, res: Response, next: NextFunction) {
	try {
		if (!req.params.chirpID) throw new BadRequestError("Chirp ID param not supplied")
		const rawToken = getBearerToken(req)
		const userid = validateJWT(rawToken, config.api.secret)
		const chirp = await getChirp(req.params.chirpID)
		if (chirp.userId != userid) {
			throw new ForbiddenError("Cannot Delete Other Users Chirps")
		}
		await deleteChirp(req.params.chirpID, userid)
		res.status(204).send()

	} catch (err) {
		next(err)
	}
}
