import {PrismaClient, Role} from '@prisma/client'
import {createPasswordHash} from '~/utils/misc.server'

const db = new PrismaClient()

async function seed() {
	await db.user.deleteMany()
	await db.product.deleteMany()
	await db.productOrder.deleteMany()
	await db.order.deleteMany()
	await db.payment.deleteMany()
	await db.seller.deleteMany()
	await db.admin.deleteMany()

	await db.admin.create({
		data: {
			name: 'Admin',
			email: 'admin@app.com',
			password: await createPasswordHash('password'),
		},
	})

	const user = await db.user.create({
		data: {
			name: 'User',
			email: 'user@app.com',
			phoneNo: '1234567890',
			password: await createPasswordHash('password'),
			role: Role.CUSTOMER,
			address: '123 Main St',
		},
	})

	await db.user.create({
		data: {
			name: 'Admin',
			email: 'admin@app.com',
			address: '123 Main St',
			phoneNo: '1234567890',
			password: await createPasswordHash('password'),
			role: Role.ADMIN,
		},
	})

	const seller = await db.user.create({
		data: {
			name: 'Seller',
			email: 'seller@app.com',
			address: '56 John St',
			phoneNo: '9876543210',
			password: await createPasswordHash('password'),
			role: Role.SELLER,
		},
	})

	await db.seller.create({
		data: {
			name: 'Seller',
			address: '56 John St',
			phoneNo: '9876543210',
			email: 'seller@app.com',
			password: await createPasswordHash('password'),
		},
	})

	const seller2 = await db.user.create({
		data: {
			name: 'John Delulu',
			email: 'johndelulu@app.com',
			address: '56 John St',
			phoneNo: '9876543210',
			password: await createPasswordHash('password'),
			role: Role.SELLER,
		},
	})

	await db.seller.create({
		data: {
			name: seller2.name,
			address: seller2.address,
			phoneNo: seller2.phoneNo,
			email: seller2.email,
			password: await createPasswordHash('password'),
		},
	})

	const products = [
		{
			name: 'Calculus 101 Textbook',
			description:
				'Used but in good condition. Perfect for Calculus beginners.',
			image:
				'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=2730&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			price: 30,
			quantity: 1,
			slug: 'calculus-101-textbook',
			approved: true,
			category: ['Books'],
			sellerId: seller.id,
		},
		{
			name: 'Dell Inspiron 15',
			description:
				'Lightly used, 8GB RAM, 1TB HDD. Suitable for all your coding and design needs.',
			image:
				'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			price: 300,
			quantity: 1,
			slug: 'dell-inspiron-15',
			approved: true,
			category: ['Electronics'],
			sellerId: seller.id,
		},
		{
			name: 'Used Trek Bicycle',
			description:
				'A reliable companion for your campus commutes. Minor wear and tear.',
			image:
				'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			price: 120,
			quantity: 1,
			slug: 'used-trek-bicycle',
			approved: true,
			category: ['Transport'],
			sellerId: seller.id,
		},

		{
			name: 'Kindle Paperwhite',
			description:
				'Enjoy a library at your fingertips. Waterproof, high-res display.',
			image:
				'https://images.unsplash.com/photo-1611650933823-97a2a1922b7e?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			price: 120,
			quantity: 1,
			slug: 'kindle-paperwhite',
			approved: true,
			category: ['Electronics'],
			sellerId: seller.id,
		},
		{
			name: 'Stationary Set',
			description:
				'Complete set includes pens, pencils, erasers, and notepads.',
			image:
				'https://images.unsplash.com/photo-1625533617580-3977f2651fc0?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			price: 20,
			quantity: 10,
			slug: 'stationary-set',
			approved: true,
			category: ['Supplies'],
			sellerId: seller.id,
		},
		{
			name: 'French Press Coffee Maker',
			description:
				'Make the perfect cup of coffee to fuel your study sessions.',
			image:
				'https://images.unsplash.com/photo-1519082274554-1ca37fb8abb7?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			price: 25,
			quantity: 5,
			slug: 'french-press-coffee-maker',
			approved: true,
			category: ['Kitchen'],
			sellerId: seller.id,
		},
	]

	products.map(async product => {
		await db.product.create({
			data: product,
		})
	})

	console.log(`Database has been seeded. 🌱`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await db.$disconnect()
	})
