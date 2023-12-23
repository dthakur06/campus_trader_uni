import {
	ArrowLeftOnRectangleIcon,
	ArrowRightOnRectangleIcon,
	UserPlusIcon,
} from '@heroicons/react/24/solid'
import {Anchor, Avatar, Button, Divider, Menu, ScrollArea} from '@mantine/core'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Form, Link, Outlet, useLocation} from '@remix-run/react'
import appConfig from 'app.config'
import {Footer} from '~/components/Footer'
import {TailwindContainer} from '~/components/TailwindContainer'
import {isCustomer, isSeller, requireUser} from '~/lib/session.server'
import {useOptionalUser} from '~/utils/hooks'

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	await requireUser(request)

	if (await isCustomer(request)) {
		return redirect('/')
	}

	if (await isSeller(request)) {
		return redirect('/seller')
	}

	return json({})
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
	const {user} = useOptionalUser()

	return (
		<>
			<Form replace action="/api/auth/logout" method="post" id="logout-form" />
			<header className="h-16 p-4">
				<TailwindContainer>
					<div className="flex h-full w-full items-center justify-between">
						<div className="flex flex-shrink-0 items-center gap-4">
							<Anchor component={Link} to="/">
								<img
									className="h-10 object-cover object-center"
									src={appConfig.logo}
									alt="Logo"
								/>
							</Anchor>
						</div>

						<div className="flex items-center gap-4">
							<Menu position="bottom-start" transition="pop-top-right">
								<Menu.Target>
									{user ? (
										<Button variant="gradient" compact>
											{user.name}
										</Button>
									) : (
										<Avatar />
									)}
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
		</>
	)
}
