import {Anchor, Button, PasswordInput, Select, TextInput} from '@mantine/core'
import {Role} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {Link, useFetcher, useSearchParams} from '@remix-run/react'
import {createUserSession} from '~/lib/session.server'
import {verifyLogin} from '~/lib/user.server'
import {LoginSchema} from '~/lib/zod.schema'
import {badRequest, safeRedirect} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'
import * as React from 'react'

interface ActionData {
	fieldErrors?: inferErrors<typeof LoginSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fieldErrors, fields} = await validateAction(request, LoginSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({fieldErrors})
	}

	const {email, password, redirectTo} = fields

	const user = await verifyLogin(email, password)
	if (!user) {
		return badRequest<ActionData>({
			fieldErrors: {
				password: 'Invalid username or password',
			},
		})
	}

	if (!user.approved) {
		return badRequest<ActionData>({
			fieldErrors: {
				password: 'Your account has not been approved yet',
			},
		})
	}

	return createUserSession({
		request,
		userId: user.id,
		role: user.role,
		remember: true,
		redirectTo: safeRedirect(redirectTo),
	})
}

export default function Login() {
	const [searchParams] = useSearchParams()

	const fetcher = useFetcher<ActionData>()
	const actionData = fetcher.data

	const redirectTo = searchParams.get('redirectTo') || '/'
	const isSubmitting = fetcher.state !== 'idle'

	const [role, setRole] = React.useState<Role>(Role.CUSTOMER)
	return (
		<>
			<div>
				<h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in</h2>
				{role === Role.CUSTOMER ? (
					<p className="mt-2 text-sm text-gray-600">
						Do not have an account yet?{' '}
						<Anchor component={Link} to="/register" size="sm" prefetch="intent">
							Create customer account
						</Anchor>
					</p>
				) : role === Role.SELLER ? (
					<p className="mt-2 text-sm text-gray-600">
						Do not have an account yet?{' '}
						<Anchor
							component={Link}
							to="/register/seller"
							size="sm"
							prefetch="intent"
						>
							Create seller account
						</Anchor>
					</p>
				) : null}
			</div>

			<fetcher.Form method="post" replace className="mt-8">
				<input type="hidden" name="redirectTo" value={redirectTo} />

				<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
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

					<Select
						label="Role"
						value={role}
						onChange={event => setRole(event as Role)}
						data={Object.values(Role).map(role => ({
							value: role,
							label: role,
						}))}
						required
					/>

					<Button
						type="submit"
						loading={isSubmitting}
						fullWidth
						loaderPosition="right"
						mt="1rem"
					>
						Sign in
					</Button>
				</fieldset>
			</fetcher.Form>
		</>
	)
}
