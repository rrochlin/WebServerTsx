import { BadRequestError, UnauthorizedError } from "../../errors.js"
import { db } from "../index.js"
import { NewRefreshToken, refreshTokens } from "../schema.js";
import { eq, sql } from "drizzle-orm";

export async function createRefreshToken(token: NewRefreshToken) {
	const [result] = await db.insert(refreshTokens)
		.values(token).onConflictDoNothing().returning();
	return result
}

export async function getRefreshToken(token: string) {
	try {
		const [result] = await db.select()
			.from(refreshTokens)
			.where(eq(refreshTokens.token, token));
		return result
	} catch (err) {
		throw new UnauthorizedError("Token not found")
	}
}

export async function getUserFromRefreshToken(token: string) {
	const [result] = await db.select().from(refreshTokens)
		.where(eq(refreshTokens.token, token))
	return result.userId
}

export async function revokeRefreshToken(token: string) {
	try {
		await db.update(refreshTokens)
			.set({ revokedAt: sql`NOW()` })
			.where(eq(refreshTokens.token, token))
	} catch (err) {
		throw new BadRequestError(`revoke failed: ${err}`)
	}
}
