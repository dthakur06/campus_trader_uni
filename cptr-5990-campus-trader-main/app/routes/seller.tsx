import {
	ArrowLeftOnRectangleIcon,
	ArrowRightOnRectangleIcon,
	LockOpenIcon,
	UserPlusIcon,
} from '@heroicons/react/24/solid'
import {
	Anchor,
	Avatar,
	Button,
	Divider,
	Menu,
	Modal,
	PasswordInput,
	ScrollArea,
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import type {ShouldReloadFunction} from '@remix-run/react'
import {Form, Link, Outlet, useFetcher, useLocation} from '@remix-run/react'
import appConfig from 'app.config'
import * as React from 'react'
import {Footer} from '~/components/Footer'
import {TailwindContainer} from '~/components/TailwindContainer'
import {isAdmin, isCustomer, requireUser} from '~/lib/session.server'
import {useUser} from '~/utils/hooks'

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (await isCustomer(request)) {
		return redirect('/')
	}

	if (await isAdmin(request)) {
		return redirect('/admin')
	}

	return json({
		hasResetPassword: user.hasResetPassword,
	})
}

export default function AppLayout() {
	return (
		<>
			<div className="flex h-full flex-col">
				<HeaderComponent />
				<ScrollArea classNames={{root: 'flex-1 bg-white'}}>
					<main className="relative">
						<div
							className="absolute inset-0 opacity-10"
							style={{
								background: 'url(/logo.jpeg) no-repeat center center',
								backgroundSize: 'contain',
							}}
						/>
						<div className="relative">
							<Outlet />
						</div>
					</main>
				</ScrollArea>
				<Footer />
			</div>
		</>
	)
}

function HeaderComponent() {
	const location = useLocation()
	const user = useUser()

	const [isModalOpen, handleModal] = useDisclosure(false)
	const fetcher = useFetcher()

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.type !== 'done') {
			return
		}

		if (!fetcher.data.success) {
			return
		}

		handleModal.close()
	}, [fetcher.data, fetcher.type, handleModal])

	return (
		<>
			<Form replace action="/api/auth/logout" method="post" id="logout-form" />
			<header className="h-[100px] p-4">
				<TailwindContainer>
					<div className="flex h-full w-full items-center justify-between">
						<div className="flex flex-shrink-0 items-center gap-4">
							<Anchor component={Link} to="/">
								<img
									className="h-20 object-cover object-center"
									src={appConfig.logo}
									alt="Logo"
								/>
							</Anchor>
						</div>

						<div className="flex items-center gap-4">
							<Menu
								position="bottom-start"
								withArrow
								transition="pop-top-right"
							>
								<Menu.Target>
									<button>
										{user ? (
											<Avatar color="blue" size="md">
												{user.name.charAt(0)}
											</Avatar>
										) : (
											<Avatar />
										)}
									</button>
								</Menu.Target>

								<Menu.Dropdown>
									{user ? (
										<>
											<Menu.Item disabled>
												<div className="flex flex-col">
													<p>{user.name}</p>
													<p className="mt-0.5 text-sm">{user.email}</p>
												</div>
											</Menu.Item>
											<Divider />

											<Menu.Item
												icon={<LockOpenIcon className="h-4 w-4" />}
												onClick={handleModal.open}
											>
												Reset Password
											</Menu.Item>

											<Menu.Item
												icon={<ArrowLeftOnRectangleIcon className="h-4 w-4" />}
												type="submit"
												form="logout-form"
											>
												Logout
											</Menu.Item>
										</>
									) : (
										<>
											<Menu.Item
												icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
												component={Link}
												to={`/login?redirectTo=${encodeURIComponent(
													location.pathname
												)}`}
											>
												Login
											</Menu.Item>
											<Menu.Item
												icon={<UserPlusIcon className="h-4 w-4" />}
												component={Link}
												to={`/register?redirectTo=${encodeURIComponent(
													location.pathname
												)}`}
											>
												Create account
											</Menu.Item>
										</>
									)}
								</Menu.Dropdown>
							</Menu>
						</div>
					</div>
				</TailwindContainer>
			</header>

			<Modal
				opened={isModalOpen}
				onClose={handleModal.close}
				title="Reset Password"
				padding="xl"
			>
				<fetcher.Form
					method="post"
					replace
					className="flex flex-col gap-4"
					action="/api/reset-password"
				>
					<div className="mt-6 flex flex-col gap-4">
						<input hidden name="userId" defaultValue={user.id} />
						<PasswordInput
							required
							name="password"
							label="Enter new password"
							placeholder="Password"
						/>

						<Button
							variant="filled"
							type="submit"
							fullWidth
							loading={isSubmitting}
							loaderPosition="right"
						>
							Update
						</Button>
					</div>
				</fetcher.Form>
			</Modal>
		</>
	)
}

export const unstable_shouldReload: ShouldReloadFunction = ({
	submission,
	prevUrl,
	url,
}) => {
	if (!submission && prevUrl.pathname === url.pathname) {
		return false
	}

	return true
}
