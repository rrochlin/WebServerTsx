import { sql } from 'drizzle-orm';
import { pgTable, timestamp, varchar, uuid, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	email: varchar('email', { length: 256 }).unique().notNull(),
	hashed_password: varchar('hashed_password', { length: 256 }).unique().notNull().default('unset'),
	isChirpyRed: boolean('is_chirpy_red').default(false).notNull(),
});

export type NewUser = typeof users.$inferInsert;

export const chirps = pgTable('chirps', {
	id: uuid('id').primaryKey().defaultRandom(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	body: varchar('body', { length: 140 }).notNull(),
	userId: uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
});

export type NewChirp = typeof chirps.$inferInsert;

export const refreshTokens = pgTable('refresh_token', {
	token: varchar('token', { length: 256 }).primaryKey(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	userId: uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
	expiresAt: timestamp('expires_at').default(sql`NOW() + INTERVAL '60 days'`).notNull(),
	revokedAt: timestamp('revoked_at'),
});

export type NewRefreshToken = typeof refreshTokens.$inferInsert;
