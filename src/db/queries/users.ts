import { eq } from 'drizzle-orm';
import { db } from '../index.js';
import { NewUser, users } from '../schema.js';

export type PublicUser = Omit<NewUser, "hashed_password">

export function toPublicUser(user: NewUser): PublicUser {
	const { hashed_password, ...publicUser } = user;
	return publicUser
}

export async function createUser(user: NewUser) {
	const [result] = await db.insert(users).values(user).onConflictDoNothing().returning();
	return result
}

export async function deleteUsers() {
	await db.delete(users);
}

export async function getUser(id: string) {
	const [result] = await db.select().from(users).where(eq(users.id, id));
	return result
}


export async function getUserByEmail(email: string) {
	const [result] = await db.select().from(users).where(eq(users.email, email));
	return result
}

export async function updateUserInfo(user: NewUser) {
	const [result] = await db.update(users)
		.set({ email: user.email, hashed_password: user.hashed_password })
		.where(eq(users.id, user.id!))
		.returning()
	return result
}

export async function upgradeUserToRed(id: string) {
	const [result] = await db.update(users)
		.set({ isChirpyRed: true })
		.where(eq(users.id, id))
		.returning()
	return result
}
