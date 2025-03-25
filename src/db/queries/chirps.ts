import { eq, asc, and, desc } from 'drizzle-orm';
import { db } from '../index.js';
import { chirps, NewChirp } from '../schema.js';

export async function createChirp(chirp: NewChirp) {
	const [result] = await db.insert(chirps).values(chirp).onConflictDoNothing().returning();
	return result
}


export async function getAlLChirps(sort: 'asc' | 'desc', id?: string) {
	const order = sort === 'asc' ? asc(chirps.createdAt) : desc(chirps.createdAt)
	if (id) {
		return await db.select().from(chirps)
			.where(eq(chirps.userId, id))
			.orderBy(order);
	}
	return await db.select().from(chirps).orderBy(order);
}

export async function getChirp(id: string) {
	const [result] = await db.select().from(chirps).where(eq(chirps.id, id));
	return result;
}

export async function deleteChirp(id: string, uuid: string) {
	const [result] = await db.delete(chirps)
		.where(and(eq(chirps.id, id), eq(chirps.userId, uuid)))
		.returning();
	return result;
}
