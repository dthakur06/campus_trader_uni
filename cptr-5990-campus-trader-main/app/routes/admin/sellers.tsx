import {ArrowLeftIcon} from '@heroicons/react/24/solid'
import {Badge, Button} from '@mantine/core'
import {Role} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Link, useFetcher, useLoaderData} from '@remix-run/react'
import * as React from 'react'
import {z} from 'zod'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/lib/prisma.server'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

const ApproveSellerSchema = z.object({
	sellerId: z.string().min(1, 'First name is required'),
})

export const loader = async () => {
	const sellers = await db.user.findMany({
		where: {role: Role.SELLER},
	})

	return json({sellers})
}

interface ActionData {
	success: boolean
	message?: string
	fieldErrors?: inferErrors<typeof ApproveSellerSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(
		request,
		ApproveSellerSchema
	)

	if (fieldErrors) {
		return badRequest<ActionData>({
			success: false,
			fieldErrors,
		})
	}

	await db.user.update({
		where: {id: fields.sellerId},
		data: {
			approved: true,
		},
	})

	return json({
		success: true,
	})
}

export default function ManageOrganizers() {
	const fetcher = useFetcher<ActionData>()
	const {sellers} = useLoaderData<typeof loader>()

	const isSubmitting = fetcher.state !== 'idle'

	return (
		<>
			<TailwindContainer className="rounded-md bg-white">
				<div className="mt-8 px-4 py-10 sm:px-6 lg:px-8">
					<div className="sm:flex sm:flex-auto sm:items-center sm:justify-between">
						<div>
							<Button
								leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
								variant="white"
								size="md"
								component={Link}
								to=".."
								pl={0}
								mb={20}
								color="gray"
							>
								Back
							</Button>
							<h1 className="text-3xl font-semibold text-gray-900">
								Manage Sellers
							</h1>
							<p className="mt-2 text-sm text-gray-700">
								A list of all the sellers in the system.
							</p>
						</div>
					</div>
					<div className="mt-8 flex flex-col">
						<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<table className="min-w-full divide-y divide-gray-300">
									<thead>
										<tr>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Name
											</th>

											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Email
											</th>
											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Type
											</th>
											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Status
											</th>
											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{sellers.map(seller => (
											<tr key={seller.id}>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{seller.name}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{seller.email}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{seller.type}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													<Badge color={seller.approved ? 'green' : 'red'}>
														{seller.approved ? 'Approved' : 'Pending'}
													</Badge>
												</td>

												<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
													<div className="flex items-center gap-6">
														<Button
															compact
															color="green"
															variant="light"
															disabled={seller.approved}
															size="sm"
															loading={isSubmitting}
															onClick={() =>
																fetcher.submit(
																	{
																		sellerId: seller.id,
																	},
																	{
																		method: 'post',
																	}
																)
															}
														>
															{seller.approved ? 'Approved' : 'Approve'}
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>
		</>
	)
}
