import {
	Anchor,
	Button,
	PasswordInput,
	Select,
	Textarea,
	TextInput,
} from '@mantine/core'
import {showNotification} from '@mantine/notifications'
import {json, type ActionFunction} from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useNavigate,
	useTransition,
} from '@remix-run/react'
import {useEffect} from 'react'
import {createSeller, getUserByEmail} from '~/lib/user.server'
import {badRequest, validateEmail, validateName} from '~/utils/misc.server'

interface ActionData {
	success?: boolean
	fieldErrors?: {
		email?: string
		password?: string
		name?: string
		type?: string
		address?: string
		phoneNo?: string
	}
}

export const action: ActionFunction = async ({request}) => {
	const formData = await request.formData()

	const email = formData.get('email')
	const password = formData.get('password')
	const confirmPassword = formData.get('confirmPassword')
	const name = formData.get('name')
	const address = formData.get('address')?.toString()
	const type = formData.get('type')?.toString()
	const phoneNo = formData.get('phoneNo')?.toString()

	if (!validateName(name)) {
		return badRequest<ActionData>({
			success: false,
			fieldErrors: {
				name: 'Name is required',
			},
		})
	}

	if (!validateEmail(email)) {
		return badRequest<ActionData>({
			success: false,
			fieldErrors: {email: 'Email is invalid'},
		})
	}

	if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
		return badRequest<ActionData>({
			success: false,
			fieldErrors: {password: 'Password is required'},
		})
	}

	if (password.length < 8 || confirmPassword.length < 8) {
		return badRequest<ActionData>({
			success: false,
			fieldErrors: {password: 'Password is too short'},
		})
	}

	if (password !== confirmPassword) {
		return badRequest<ActionData>({
			success: false,
			fieldErrors: {password: 'Passwords do not match'},
		})
	}

	if (!type) {
		return badRequest<ActionData>({
			success: false,
			fieldErrors: {type: 'Type is required'},
		})
	}

	if (!address) {
		return badRequest<ActionData>({
			success: false,
			fieldErrors: {address: 'Address is required'},
		})
	}

	if (!phoneNo) {
		return badRequest<ActionData>({
			success: false,
			fieldErrors: {phoneNo: 'Phone Number is required'},
		})
	}

	const existingUser = await getUserByEmail(email)
	if (existingUser) {
		return badRequest<ActionData>({
			success: false,
			fieldErrors: {email: 'A user already exists with this email'},
		})
	}

	await createSeller({
		email,
		password,
		name,
		type,
		address,
		phoneNo,
	})

	return json({
		success: true,
	})
}
export default function Register() {
	const transition = useTransition()
	const actionData = useActionData<ActionData>()
	const isSubmitting = transition.state !== 'idle'
	const navigate = useNavigate()

	useEffect(() => {
		if (isSubmitting) return
		if (!actionData) return

		if (actionData.success) {
			showNotification({
				title: 'Account created',
				message: 'Once your account is approved, you will be able to login.',
				color: 'green',
			})
			navigate('/login')
		}
	}, [actionData, isSubmitting, navigate])

	return (
		<>
			<div>
				<h2 className="mt-6 text-3xl font-extrabold text-gray-900">Register</h2>
				<p className="mt-2 text-sm text-gray-600">
					Have an account already?{' '}
					<Anchor component={Link} to="/login" size="sm" prefetch="intent">
						Sign in
					</Anchor>
				</p>
			</div>

			<Form replace method="post" className="mt-8">
				<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
					<TextInput
						name="name"
						autoComplete="given-name"
						label="Name"
						error={actionData?.fieldErrors?.name}
						required
					/>

					<TextInput
						name="email"
						type="email"
						autoComplete="email"
						label="Email address"
						error={actionData?.fieldErrors?.email}
						required
					/>

					<PasswordInput
						name="password"
						label="Password"
						error={actionData?.fieldErrors?.password}
						autoComplete="current-password"
						required
					/>

					<PasswordInput
						name="confirmPassword"
						label="Confirm password"
						error={actionData?.fieldErrors?.password}
						autoComplete="current-password"
						required
					/>

					<Select
						name="type"
						label="You are a"
						error={actionData?.fieldErrors?.type}
						data={[
							{
								label: 'Faculty',
								value: 'Faculty',
							},
							{
								label: 'Student',
								value: 'Student',
							},
						]}
						required
					/>

					<Textarea
						name="address"
						label="Address"
						autoComplete="street-address"
						required
					/>

					<TextInput
						name="phoneNo"
						type="tel"
						autoComplete="tel"
						label="Phone Number"
						error={actionData?.fieldErrors?.phoneNo}
						required
					/>

					<Button
						type="submit"
						loading={isSubmitting}
						fullWidth
						loaderPosition="right"
						mt="1rem"
					>
						Register
					</Button>
				</fieldset>
			</Form>
		</>
	)
}
