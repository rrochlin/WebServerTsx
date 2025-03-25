import * as bcrypt from "bcrypt"
import pkg from "jsonwebtoken"
const { sign, verify } = pkg;
import { JwtPayload } from "jsonwebtoken";
import { BadRequestError, UnauthorizedError } from "../errors.js"
import { Request } from "express";
import { randomBytes } from "crypto";
import { NewRefreshToken } from "../db/schema.js";
import { createRefreshToken } from "../db/queries/refreshTokens.js";
import { config } from "../config.js";

export async function hashPassword(password: string) {
	const hashedPass = await bcrypt.hash(password, 10);
	return hashedPass
}

export async function checkPasswordHash(password: string, hash: string) {
	return await bcrypt.compare(password, hash);
}

export type payload = Pick<JwtPayload, 'iss' | 'sub' | 'iat' | 'exp'>

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
	const iat = Math.floor(Date.now() / 1000)
	const res = sign({ 'iss': 'chirpy', 'sub': userID, 'iat': iat, 'exp': iat + expiresIn } as payload, secret)
	return res

}

export function validateJWT(tokenString: string, secret: string): string {
	try {
		var decoded = verify(tokenString, secret) as payload

		if (decoded.iss !== config.api.issuer) {
			throw new UnauthorizedError("Invalid issuer");
		}

		if (!decoded.sub) {
			throw new UnauthorizedError("No user ID in token");
		}

		if ((decoded.exp ?? 0) < Math.floor(Date.now() / 1000)) {
			throw new UnauthorizedError("expired token")
		}
	} catch (err) {
		throw new UnauthorizedError(`jwt token invalid: ${err}`)
	}
	return decoded.sub!
}

export function getBearerToken(req: Request): string {
	try {
		const auth = req.get('Authorization')
		if (!auth) throw new Error
		if (auth.startsWith("Bearer")) return auth?.slice(6).trimStart()
		return auth
	} catch (err) {
		throw new UnauthorizedError("Malformed Auth Header")
	}
}

export async function makeRefreshToken(uuid: string) {
	try {
		const r = randomBytes(32).toString('hex')
		const t: NewRefreshToken = { userId: uuid, token: r }
		const token = await createRefreshToken(t)
		return token
	} catch (err) {
		throw err
	}
}

export function getAPIKey(req: Request): string {
	try {
		const auth = req.get('Authorization')
		if (!auth) throw new Error
		if (auth.startsWith("ApiKey")) return auth?.slice(6).trimStart()
		return auth
	} catch (err) {
		throw new UnauthorizedError("Malformed Auth Header")
	}

}
