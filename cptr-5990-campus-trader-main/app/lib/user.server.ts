import type {User} from '@prisma/client'
import {Role} from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import {db} from '~/lib/prisma.server'
import {createPasswordHash} from '~/utils/misc.server'

export async function getUserById(id: User['id']) {
	return db.user.findUnique({
		where: {id},
		select: {
			id: true,
			name: true,
			email: true,
			address: true,
			hasResetPassword: true,
		},
	})
}

export async function getUserByEmail(email: User['email']) {
	return db.user.findUnique({
		where: {email},
		select: {
			name: true,
			email: true,
		},
	})
}

export async function createUser({
	email,
	password,
	name,
	role = Role.CUSTOMER,
	phoneNo,
	address,
}: {
	email: User['email']
	password: string
	name: User['name']
	role?: User['role']
	phoneNo: User['phoneNo']
	address: User['address']
}) {
	if (role === Role.SELLER) {
		await db.seller.create({
			data: {
				name,
				email,
				address,
				phoneNo,
				password: await createPasswordHash(password),
			},
		})
	}
	return db.user.create({
		data: {
			name,
			email,
			phoneNo,
			approved: role === Role.SELLER ? false : true,
			password: await createPasswordHash(password),
			role,
			address,
		},
	})
}

export async function createSeller({
	email,
	password,
	name,
	phoneNo,
	type,
	address,
}: {
	email: User['email']
	password: string
	name: User['name']
	phoneNo: User['phoneNo']
	type: User['type']
	address: User['address']
}) {
	await db.seller.create({
		data: {
			name,
			email,
			address,
			phoneNo,
			password: await createPasswordHash(password),
		},
	})

	return db.user.create({
		data: {
			name,
			email,
			phoneNo,
			type,
			approved: false,
			password: await createPasswordHash(password),
			role: Role.SELLER,
			address,
		},
	})
}

export async function verifyLogin(email: User['email'], password: string) {
	const userWithPassword = await db.user.findUnique({
		where: {email},
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password)

	if (!isValid) {
		return null
	}

	const {password: _password, ...userWithoutPassword} = userWithPassword

	return userWithoutPassword
}
