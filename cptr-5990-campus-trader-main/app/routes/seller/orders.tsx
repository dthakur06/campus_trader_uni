import {ArrowLeftIcon, ShoppingCartIcon} from '@heroicons/react/24/solid'
import {Badge, Button, Modal, Select} from '@mantine/core'
import {OrderStatus} from '@prisma/client'
import type {ActionArgs, LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Link, useLoaderData, useSubmit, useTransition} from '@remix-run/react'
import invariant from 'tiny-invariant'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/lib/prisma.server'
import {requireUserId} from '~/lib/session.server'
import {
	formatCurrency,
	formatDateTime,
	orderStatusColorLookup,
	orderStatusLabelLookup,
	titleCase,
} from '~/utils/misc'
import * as React from 'react'
import {useUser} from '~/utils/hooks'

export const loader = async ({request}: LoaderArgs) => {
	const sellerId = await requireUserId(request)

	const orders = await db.order.findMany({
		where: {
			products: {
				some: {
					product: {
						sellerId,
					},
				},
			},
		},
		orderBy: {createdAt: 'desc'},
		include: {
			user: true,
			payment: true,
			products: {
				include: {
					product: true,
				},
			},
		},
	})
	return json({orders})
}

export const action = async ({request}: ActionArgs) => {
	const formData = await request.formData()

	const intent = formData.get('intent')?.toString()
	invariant(intent, 'Invalid intent')

	const orderId = formData.get('orderId')?.toString()
	invariant(orderId, 'Invalid order id')

	switch (intent) {
		case 'update-order-status': {
			const status = formData.get('status')?.toString()
			invariant(status, 'Invalid status')

			await db.order.update({
				where: {id: orderId},
				data: {status: status as OrderStatus},
			})

			return json({success: true})
		}

		default:
			return json({success: false, message: 'Invalid intent'}, {status: 400})
	}
}

export default function Orders() {
	const {orders} = useLoaderData<typeof loader>()
	const transition = useTransition()
	const submit = useSubmit()
	const user = useUser()

	const isSubmitting = transition.state !== 'idle'

	const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(
		null
	)
	const selectedOrder = orders.find(order => order.id === selectedOrderId)

	return (
		<>
			<TailwindContainer className="mt-16">
				<div className="px-4 sm:px-6 lg:px-8">
					<div className="sm:flex sm:items-center">
						<div className="sm:flex-auto">
							<div className="mb-12">
								<Button
									leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
									variant="white"
									size="md"
									component={Link}
									to=".."
									pl={0}
								>
									Back
								</Button>
							</div>

							<h1 className="text-xl font-semibold text-gray-900">Orders</h1>
							<p className="mt-2 text-sm text-gray-700">
								A list of all the orders in your account including their user
								details.
							</p>
						</div>
					</div>
					<div className="mt-8 flex flex-col">
						<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
									{orders.length > 0 ? (
										<table className="min-w-full divide-y divide-gray-300">
											<thead className="bg-gray-50">
												<tr>
													<th
														scope="col"
														className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
													>
														Name
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Type
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Status
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Products
													</th>
													<th
														scope="col"
														className="relative py-3.5 pl-3 pr-4 sm:pr-6"
													>
														Update status
														<span className="sr-only">Edit</span>
													</th>
												</tr>
											</thead>
											<tbody className="bg-[rgb(129, 135, 80)] divide-y divide-gray-200">
												{orders.map(order => {
													const statusOptions: OrderStatus[] = [
														'PENDING',
														'IN_TRANSIT',
														'DELIVERED',
													]

													return (
														<tr key={order.id}>
															<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
																<div className="flex items-center">
																	<div className="h-10 w-10 flex-shrink-0">
																		<img
																			className="h-10 w-10 rounded-full"
																			src={order.products[0].product.image}
																			alt=""
																		/>
																	</div>
																	<div className="ml-4">
																		<div className="font-medium text-gray-900">
																			{order.user.name}
																		</div>
																		<div className="text-gray-500">
																			{order.user.email}
																		</div>
																	</div>
																</div>
															</td>

															<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
																<div className="text-gray-900">
																	{titleCase(order.type)}
																</div>
																<div className="text-gray-500">
																	(
																	{titleCase(
																		order.payment?.paymentMethod ?? ''
																	)}
																	)
																</div>
															</td>

															<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
																<Badge
																	color={orderStatusColorLookup[order.status]}
																>
																	{orderStatusLabelLookup[order.status]}
																</Badge>
															</td>
															<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
																<Button
																	variant="subtle"
																	color="blue"
																	size="sm"
																	compact
																	onClick={() => {
																		setSelectedOrderId(order.id)
																	}}
																>
																	View
																</Button>
															</td>

															<td className="relative flex items-center justify-center whitespace-nowrap py-4 pl-3 pr-4 text-sm font-medium sm:pr-6">
																<div className="flex items-center gap-2">
																	<Select
																		className="w-48"
																		defaultValue={order.status}
																		withinPortal
																		data={statusOptions.map(status => ({
																			value: status,
																			label: orderStatusLabelLookup[status],
																		}))}
																		disabled={
																			isSubmitting ||
																			order.status === OrderStatus.DELIVERED ||
																			order.status === OrderStatus.CANCELLED
																		}
																		onChange={val => {
																			submit(
																				{
																					intent: 'update-order-status',
																					orderId: order.id,
																					status: val as OrderStatus,
																				},
																				{
																					method: 'post',
																					replace: true,
																				}
																			)
																		}}
																	/>
																</div>
															</td>
														</tr>
													)
												})}
											</tbody>
										</table>
									) : (
										<div className="bg-[rgb(129, 135, 80)] relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
											<ShoppingCartIcon className="mx-auto h-9 w-9 text-gray-500" />
											<span className="mt-4 block text-sm font-medium text-gray-500">
												No orders placed yet. <br />
												Come back later.
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>

			<Modal
				opened={Boolean(selectedOrder)}
				onClose={() => setSelectedOrderId(null)}
			>
				{selectedOrder && (
					<div className="bg-white">
						<div className="sm:flex sm:items-start">
							<div className="text-center sm:mt-0 sm:ml-4 sm:text-left">
								<h3
									className="text-lg font-medium leading-6 text-gray-900"
									id="modal-headline"
								>
									Order Details
								</h3>
								<div className="mt-6">
									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-2">
											<div className="font-semibold">Order ID:</div>
											<div>{selectedOrder.id}</div>
										</div>

										<div className="flex items-center gap-2">
											<div className="font-semibold">Order Total:</div>
											<div>
												{formatCurrency(selectedOrder.payment?.amount!)}
											</div>
										</div>

										<div className="flex items-center gap-2">
											<div className="font-semibold">Order Date:</div>
											<div>{formatDateTime(selectedOrder.createdAt)}</div>
										</div>

										<div className="flex items-center gap-2">
											<div className="font-semibold">Delivery Address:</div>
											<div>{selectedOrder.payment?.address}</div>
										</div>
									</div>
								</div>

								{/* products with quantity */}
								<div className="mt-6">
									<div className="flex flex-col justify-start gap-2">
										<h4 className="text-left font-semibold">Products:</h4>
										{selectedOrder.products
											.filter(p => p.product.sellerId === user.id)

											.map(product => (
												<div
													key={product.id}
													className="flex items-center gap-2"
												>
													<span>
														{product.product.name} (x{product.quantity})
													</span>
												</div>
											))}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</Modal>
		</>
	)
}
