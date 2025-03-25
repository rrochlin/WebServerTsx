import { NextFunction, Request, Response } from "express";
import { getUser, upgradeUserToRed } from "../../db/queries/users.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../errors.js";
import { config } from "../../config.js"
import { getAPIKey } from "../auth.js";


export async function polkaWebhook(req: Request, res: Response, next: NextFunction) {
	type parameters = {
		event: string,
		data: {
			userId: string
		}
	}
	try {
		const parsedBody: parameters = req.body
		if (config.api.polkaApiKey != getAPIKey(req)) {
			throw new UnauthorizedError("Invalid Api Key")
		}
		if (!parsedBody.event || !parsedBody.data.userId) {
			throw new BadRequestError("Missing fields from body")
		}
		if (parsedBody.event != 'user.upgraded') {
			res.status(204).send()
			return
		}
		const user = await getUser(parsedBody.data.userId)
		if (!user) {
			throw new NotFoundError("User Not Found")
		}
		const _ = await upgradeUserToRed(user.id)
		res.status(204).send()
	} catch (err) {
		next(err)
	}
}
