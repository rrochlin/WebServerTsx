import { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile()

type Config = {
	api: APIConfig,
	db: DBConfig
}

type APIConfig = {
	fileserverHits: number,
	port: number,
	url: string,
	platform: string,
	secret: string,
	issuer: string,
	polkaApiKey: string,
}

type DBConfig = {
	url: string,
	migrationConfig: MigrationConfig,
}

export const config: Config = {
	api: {
		fileserverHits: 0,
		port: Number(envOrThrow("PORT")),
		url: envOrThrow("HOST_URL"),
		platform: envOrThrow("PLATFORM"),
		secret: envOrThrow("SECRET"),
		issuer: 'chirpy',
		polkaApiKey: envOrThrow("POLKA_API_KEY")
	},
	db: {
		url: envOrThrow("DB_URL"),
		migrationConfig: { migrationsFolder: './src/db/migrations' }
	}
}



function envOrThrow(key: string) {
	if (process.env.hasOwnProperty(key) && process.env[key]) {
		return process.env[key]
	}
	throw `${key} was not set in the env`
}
