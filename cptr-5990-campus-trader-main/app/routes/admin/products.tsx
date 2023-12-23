import {ArrowLeftIcon} from '@heroicons/react/24/solid'
import {
	Badge,
	Button,
	Modal,
	MultiSelect,
	NumberInput,
	Switch,
	TextInput,
	Textarea,
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {Product} from '@prisma/client'
import type {ActionFunction, LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Link, useFetcher, useLoaderData} from '@remix-run/react'
import {ObjectId} from 'bson'
import * as React from 'react'
import slugify from 'slugify'
import {z} from 'zod'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/lib/prisma.server'
import {categories} from '~/utils/constant'
import {formatList} from '~/utils/misc'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

const ManageProductSchema = z.object({
	productId: z.string().optional(),
	name: z.string().min(1, 'Name is required'),
	description: z.string().min(1, 'Description is required'),
	quantity: z.preprocess(
		Number,
		z.number().min(0, 'Quantity must be at least 0')
	),
	price: z.preprocess(
		Number,
		z.number().min(0, 'Price must be greater than 0')
	),
	commission: z.preprocess(
		Number,
		z.number().min(0, 'Price must be greater than 0')
	),
	image: z.string().min(1, 'Image is required'),
	category: z
		.string()
		.min(1, 'Category is required')
		.transform(value => value.split(',')),
	approved: z.string().optional(),
})

export const loader = async ({request}: LoaderArgs) => {
	const products = await db.product.findMany({
		include: {
			seller: true,
		},
	})

	return json({
		products,
	})
}

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageProductSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(
		request,
		ManageProductSchema
	)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	const {productId, approved, ...rest} = fields
	const id = new ObjectId()

	await db.product.update({
		where: {
			id: productId || id.toString(),
		},
		data: {
			...rest,
			approved: approved === 'on',
			slug: slugify(rest.name, {lower: true}),
		},
	})

	return json({
		success: true,
	})
}

export default function ManageProduct() {
	const fetcher = useFetcher<ActionData>()
	const {products} = useLoaderData<typeof loader>()

	const [selectedProductId, setSelectedProductId] = React.useState<
		Product['id'] | null
	>(null)

	const [selectedProduct, setSelectedProduct] = React.useState<
		typeof products[number] | null
	>(null)
	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.state !== 'idle' && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			setSelectedProductId(null)
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	React.useEffect(() => {
		if (!selectedProductId) {
			setSelectedProduct(null)
			return
		}

		const product = products.find(product => product.id === selectedProductId)
		if (!product) return

		setSelectedProduct(product)
		handleModal.open()
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [products, selectedProductId])

	return (
		<>
			<TailwindContainer className="bg-[rgb(129, 135, 80)] rounded-md">
				<div className="mt-8 px-4 py-10 sm:px-6 lg:px-8">
					<div className="sm:flex sm:flex-auto sm:items-center sm:justify-between">
						<div>
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

							<h1 className="text-xl font-semibold text-gray-900">
								Manage Products
							</h1>
							<p className="mt-2 text-sm text-gray-700">
								A list of all the products currently present in store.
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
												Seller
											</th>
											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Price
											</th>
											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Commision
											</th>
											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Quantity
											</th>
											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Category
											</th>
											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Approved
											</th>
											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											>
												<span className="sr-only">Actions</span>
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{products.map(product => (
											<tr key={product.id}>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{product.name}
												</td>
												<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
													<div className="flex flex-col">
														<p>{product.seller.name}</p>
														<p className="text-xs text-gray-400">
															{product.seller.email}
														</p>
													</div>
												</td>
												<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
													${product.price.toFixed(2)}
												</td>
												<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
													${product.commission.toFixed(2)}
												</td>
												<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
													{product.quantity}
												</td>
												<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
													{formatList(product.category)}
												</td>
												<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
													<Badge color={product.approved ? 'green' : 'red'}>
														{product.approved ? 'Yes' : 'No'}
													</Badge>
												</td>

												<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
													<div className="flex items-center gap-6">
														<Button
															loading={isSubmitting}
															variant="subtle"
															loaderPosition="right"
															onClick={() => {
																setSelectedProductId(product.id)
															}}
														>
															Edit
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

			<Modal
				opened={isModalOpen}
				onClose={() => {
					setSelectedProductId(null)
					handleModal.close()
				}}
				title="Edit Product"
				centered
				overlayBlur={1}
				overlayOpacity={0.7}
				closeOnClickOutside={isSubmitting ? false : true}
				closeOnEscape={isSubmitting ? false : true}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="productId" value={selectedProduct?.id} />

						<TextInput
							name="name"
							label="Name"
							defaultValue={selectedProduct?.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<Textarea
							name="description"
							label="Description"
							defaultValue={selectedProduct?.description}
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<NumberInput
							name="price"
							label="Price"
							min={0}
							defaultValue={selectedProduct?.price}
							error={fetcher.data?.fieldErrors?.price}
							precision={2}
							required
						/>

						<NumberInput
							name="commission"
							label="Commission"
							min={0}
							defaultValue={selectedProduct?.commission}
							error={fetcher.data?.fieldErrors?.commission}
							precision={2}
							required
						/>

						<NumberInput
							name="quantity"
							label="Quantity"
							min={0}
							defaultValue={selectedProduct?.quantity}
							error={fetcher.data?.fieldErrors?.quantity}
							required
						/>

						<TextInput
							name="image"
							label="Image"
							defaultValue={selectedProduct?.image}
							error={fetcher.data?.fieldErrors?.image}
							required
						/>

						<MultiSelect
							name="category"
							label="Category"
							required
							data={categories}
							defaultValue={selectedProduct?.category}
							placeholder="Select categories"
							searchable
							error={fetcher.data?.fieldErrors?.category}
						/>

						<Switch
							name="approved"
							label="Approved"
							defaultChecked={selectedProduct?.approved}
							error={fetcher.data?.fieldErrors?.approved}
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								type="button"
								disabled={isSubmitting}
								onClick={() => handleModal.close()}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
							>
								Save changes
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
