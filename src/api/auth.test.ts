import { describe, it, expect, beforeAll } from 'vitest';
import { getBearerToken, makeJWT, validateJWT } from './auth';
import { Request } from "express"

describe('Create JWT', () => {
	const uuid = 'sample user id thats not a uui';
	const secret = '1337'

	it('create should succeed returning string', () => {
		expect(makeJWT(uuid, 0, secret)).toBeTypeOf("string");
	});

});

describe('Validate JWT', () => {
	const uuid = 'sample user id thats not a uui';
	const secret = '1337'
	var jwt1: string;
	var jwt2: string;

	beforeAll(() => {
		jwt1 = makeJWT(uuid, 1337, secret);
		jwt2 = makeJWT(uuid, 0, secret);
	});

	it('should return true for the correct password', () => {
		const result = validateJWT(jwt1, secret);
		expect(result).toBe(uuid)
	});

	it('should return false for a different secret', () => {
		expect(() => validateJWT(jwt1, 'bad secret')).toThrow()
	});

	it('secret should be expired', () => {
		expect(() => validateJWT(jwt2, secret)).toThrow();
	});
});

